import { Vec3 } from 'vec3'
import { Item } from 'minecraft-data'
import prismarineBlock, { Block } from 'prismarine-block'
import facingData from './facingData'
import { Bot } from 'mineflayer'
import { Action, ActionType, blocksCanBeReplaced, Facing } from '../types'
import { getSecondBlock } from './ChestHelper'
import blocksWithVariablePropierties from './blocksWithVariablePropierties'

import ignoreStateBlocks from './ignoreStateBlocks'

//@ts-ignore
import { Schematic } from 'prismarine-schematic'
//@ts-ignore
import { getShapeFaceCenters } from 'mineflayer-pathfinder/lib/shapes'

export class Build {
  bot: Bot
  schematic: Schematic
  at: Vec3
  min: Vec3
  max: Vec3
  breakNoneAir: boolean
  actions: Array<Action>

  world: any
  currentLayer: number | undefined
  prismarineBlock: any

  constructor(bot: Bot, schematic: Schematic, world: any, at: Vec3) {
    this.bot = bot
    this.schematic = schematic
    this.world = world
    this.at = at

    //@ts-ignore
    this.prismarineBlock = prismarineBlock(schematic.version)

    this.min = at.plus(schematic.offset)
    this.max = this.min.plus(schematic.size)

    const diff = this.min.y - (this.at.y)
    this.at.y -= diff

    this.min = at.plus(schematic.offset)
    this.max = this.min.plus(schematic.size)

    this.breakNoneAir = true

    this.actions = []
    this.updateActions()

    // How many actions ?
    // console.log(this.actions)
  }

  findItem(name: string): Item {

    // if (name === 'redstone_wall_torch') {
    //   return this.bot.registry.itemsByName['redstone_torch']
    // }

    // if (name === 'redstone_wire') {
    //   return this.bot.registry.itemsByName['redstone']
    // }

    return this.bot.registry.itemsByName[name]
  }

  updateActions() {
    this.actions = []
    const cursor = new Vec3(0, 0, 0)
    for (cursor.y = this.min.y; cursor.y < this.max.y; cursor.y++) {
      for (cursor.z = this.min.z; cursor.z < this.max.z; cursor.z++) {
        for (cursor.x = this.min.x; cursor.x < this.max.x; cursor.x++) {
          const blockSchema = this.schematic.getBlock(cursor.minus(this.at))
          const blockWorld = this.bot.blockAt(cursor) as Block
          const item = this.findItem(blockSchema.name)


          const stateInWorld = this.world.getBlockStateId(cursor)
          const wantedState = this.schematic.getBlockStateId(cursor.minus(this.at))
          if (stateInWorld !== wantedState) {

            if (wantedState === 0) {
              if (!this.breakNoneAir) continue
              this.actions.push({
                type: ActionType.dig,
                pos: cursor.clone(),
                state: wantedState,
                block: blockSchema,
                item
              })
              continue
            }

            if (blockSchema?.name === 'lava') {
              this.actions.push({
                type: ActionType.lava,
                pos: cursor.clone(),
                state: wantedState,
                block: blockSchema,
                item
              })
              continue
            }

            if (blockSchema?.name === blockWorld?.name && ignoreStateBlocks.includes(blockWorld?.name)
            ) {
              continue
            }

            if (
              blockSchema?.name !== blockWorld?.name
              && !blocksCanBeReplaced.includes(blockWorld?.name)
            ) {
              this.actions.push({
                type: ActionType.dig,
                pos: cursor.clone(),
                state: wantedState,
                block: blockSchema,
                item
              })
            }

            if (blockSchema?.name === 'chest') { // Check sides block are correct
              this.checkChestAction(blockSchema, blockWorld, cursor.clone(), wantedState, item)
              continue
            }


            if (Object.keys(blocksWithVariablePropierties).includes(blockSchema.name)) {
              this.checkIntaractableBlocks(blockSchema, blockWorld, cursor.clone(), wantedState, item)
              continue
            }

            this.actions.push({
              type: ActionType.place,
              pos: cursor.clone(),
              state: wantedState,
              block: blockSchema,
              item
            })

          }
        }
      }
    }
  }

  checkIntaractableBlocks(block: Block, blockWorld: Block, pos: Vec3, state: number, item: Item) {

    const { prop, defaultValue } = blocksWithVariablePropierties[block.name]

    if (block?.name !== blockWorld?.name) {
      this.actions.push({
        type: ActionType.place,
        pos,
        state,
        block,
        item,
      })
    }

    const expectedProp = block.getProperties()[prop]

    if (block?.name !== blockWorld?.name && expectedProp !== defaultValue) {
      this.actions.push({
        type: ActionType.click,
        pos,
        state,
        block,
        item,
      })
      return
    }

    if (block?.name === blockWorld?.name && expectedProp !== blockWorld.getProperties()[prop]) {
      this.actions.push({
        type: ActionType.click,
        pos,
        state,
        block,
        item,
      })
      return
    }
  }

  checkChestAction(block: Block, blockWorld: Block, pos: Vec3, state: number, item: Item) {

    const { facing, type } = block.getProperties()
    //@ts-ignore
    const secondblock = getSecondBlock(facing, type)
    const secondBlockWorld = this.bot.blockAt(blockWorld.position.plus(secondblock))

    if (
      blockWorld.name === 'chest' &&
      secondBlockWorld?.name === 'chest'
    ) {
      this.actions.push({
        type: ActionType.dig,
        pos,
        state,
        block,
        item
      })
    }

    this.actions.push({
      type: ActionType.place,
      pos,
      state,
      block,
      item
    })

  }


  getFacing(stateId: number, facing?: Facing) {
    if (!facing) return { facing: null, faceDirection: false, is3D: false }
    const block = this.prismarineBlock.fromStateId(stateId, 0)
    const data = facingData[block.name]
    if (data.inverted) {
      if (facing === 'up') facing = 'down'
      else if (facing === 'down') facing = 'up'
      else if (facing === 'north') facing = 'south'
      else if (facing === 'south') facing = 'north'
      else if (facing === 'west') facing = 'east'
      else if (facing === 'east') facing = 'west'
    }
    return { facing, faceDirection: data.faceDirection, is3D: data.is3D }
  }

  getPossibleDirections(action: Action) {
    const { pos, block, state } = action
    const faces = [true, true, true, true, true, true]
    const properties = block.getProperties()

    if (properties.axis) {
      if (properties.axis === 'x') faces[0] = faces[1] = faces[2] = faces[3] = false
      if (properties.axis === 'y') faces[2] = faces[3] = faces[4] = faces[5] = false
      if (properties.axis === 'z') faces[0] = faces[1] = faces[4] = faces[5] = false
    }

    if (properties.half === 'upper') return []
    if (properties.half === 'top' || properties.type === 'top') faces[0] = faces[1] = false
    if (properties.half === 'bottom' || properties.type === 'bottom') faces[0] = faces[1] = false

    if (properties.facing) {
      const { facing, faceDirection } = this.getFacing(state, properties.facing)
      if (faceDirection) {
        if (facing === 'north') faces[0] = faces[1] = faces[2] = faces[4] = faces[5] = false
        else if (facing === 'south') faces[0] = faces[1] = faces[3] = faces[4] = faces[5] = false
        else if (facing === 'west') faces[0] = faces[1] = faces[2] = faces[3] = faces[4] = false
        else if (facing === 'east') faces[0] = faces[1] = faces[2] = faces[3] = faces[5] = false
        else if (facing === 'up') faces[1] = faces[2] = faces[3] = faces[4] = faces[5] = false
        else if (facing === 'down') faces[0] = faces[2] = faces[3] = faces[4] = faces[5] = false
      }
    }

    if (properties.hanging) faces[0] = faces[2] = faces[3] = faces[4] = faces[5] = false
    if (block.material === 'plant') faces[1] = faces[2] = faces[3] = faces[4] = faces[5] = false

    let dirs: Array<Vec3> = []

    const faceDir =
      [
        new Vec3(0, -1, 0),
        new Vec3(0, 1, 0),
        new Vec3(0, 0, -1),
        new Vec3(0, 0, 1),
        new Vec3(-1, 0, 0),
        new Vec3(1, 0, 0)
      ]

    for (let i = 0; i < faces.length; i++) {
      if (faces[i]) dirs.push(faceDir[i])
    }

    const half = properties.half ? properties.half : properties.type

    dirs = dirs.filter(dir => {
      const block = this.world.getBlock(pos.plus(dir))
      if (!block) return false
      //@ts-ignore
      return getShapeFaceCenters(block.shapes, dir.scaled(-1), half).length > 0
    })

    return dirs
  }

  removeAction(action: Action) {
    this.actions.splice(this.actions.indexOf(action), 1)
  }

  getAvailableActions() {
    return this.actions.filter(action => {
      if (action.type === ActionType.dig) return true
      if (action.type === ActionType.lava) return false
      if (action.type === ActionType.water) return false
      if (this.getPossibleDirections(action).length > 0) return true
      return false
    })
  }

  getNextAction(): Action | undefined {
    const actions = this.getAvailableActions()
    if (actions.length === 0) {
      return undefined
    }

    actions.sort((a, b) => {
      let dA = a.pos.distanceSquared(this.bot.entity.position)
      let dB = b.pos.distanceSquared(this.bot.entity.position)
      dA += (a.pos.y - this.bot.entity.position.y) * 1000 // Priorize the layer
      dB += (b.pos.y - this.bot.entity.position.y) * 1000
      const distance = dA - dB

      if (distance !== 0) return distance

      if (a.type > b.type) return 1
      if (a.type < b.type) return -1

      return 0
    })

    const action = actions[0]

    if (action.pos.y !== this.currentLayer) {
      this.updateActions()
      this.currentLayer = action.pos.y
      return this.getNextAction()
    }

    return action
  }
}

