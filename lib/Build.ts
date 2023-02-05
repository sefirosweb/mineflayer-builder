import { Vec3 } from 'vec3'
import minecraftDataLoader, { Item } from 'minecraft-data'
import { Block } from 'prismarine-block'
import facingData from './facingData'
import { Bot } from 'mineflayer'

//@ts-ignore
import { getShapeFaceCenters } from 'mineflayer-pathfinder/lib/shapes'
//@ts-ignore
import { Schematic } from 'prismarine-schematic'
import { Action, ActionType, BlockProperty, Facing } from '../types'

export class Build {
  bot: Bot
  schematic: Schematic
  at: Vec3
  min: Vec3
  max: Vec3
  breakNoneAir: boolean
  actions: Array<Action>
  blocks: Record<number, Block>
  items: Record<number, Item>
  properties: Record<number, BlockProperty>

  world: any
  currentLayer: number | undefined

  constructor(bot: Bot, schematic: Schematic, world: any, at: Vec3) {
    this.bot = bot
    this.schematic = schematic
    //@ts-ignore
    this.world = world
    this.at = at

    this.min = at.plus(schematic.offset)
    this.max = this.min.plus(schematic.size)

    this.breakNoneAir = true

    this.actions = []
    this.updateActions()

    // Cache of blockstate to block
    const Block = require('prismarine-block')(schematic.version)
    const mcData = minecraftDataLoader(schematic.version)
    this.blocks = {}
    this.properties = {}
    this.items = {}
    for (const stateId of schematic.palette) {
      const block = Block.fromStateId(stateId, 0)
      this.blocks[stateId] = block
      this.properties[stateId] = block.getProperties()
      this.items[stateId] = mcData.itemsByName[block.name]
    }

    // How many actions ?
    // console.log(this.actions)
  }

  updateActions() {
    this.actions = []
    const cursor = new Vec3(0, 0, 0)
    for (cursor.y = this.min.y; cursor.y < this.max.y; cursor.y++) {
      for (cursor.z = this.min.z; cursor.z < this.max.z; cursor.z++) {
        for (cursor.x = this.min.x; cursor.x < this.max.x; cursor.x++) {
          const block = this.schematic.getBlock(cursor.minus(this.at))
          const stateInWorld = this.world.getBlockStateId(cursor)
          const wantedState = this.schematic.getBlockStateId(cursor.minus(this.at))
          if (stateInWorld !== wantedState) {
            if (wantedState === 0) {
              if (!this.breakNoneAir) continue
              this.actions.push({ type: ActionType.dig, pos: cursor.clone(), block })
            } else if (block?.name === 'chest') {
              this.checkChestAction(block, cursor.clone(), wantedState)
            } else {
              this.actions.push({ type: ActionType.place, pos: cursor.clone(), state: wantedState, block })
            }
          }
        }
      }
    }
  }

  checkChestAction(block: Block, pos: Vec3, state: number) {
    this.actions.push({ type: ActionType.place, pos, state, block })
  }

  getItemForState(stateId: number) {
    return this.items[stateId]
  }

  getFacing(stateId: number, facing?: Facing) {
    if (!facing) return { facing: null, faceDirection: false, is3D: false }
    const block = this.blocks[stateId]
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

  getPossibleDirections(stateId: number, pos: Vec3) {
    const faces = [true, true, true, true, true, true]
    const properties = this.properties[stateId]
    const block = this.blocks[stateId]

    if (properties.axis) {
      if (properties.axis === 'x') faces[0] = faces[1] = faces[2] = faces[3] = false
      if (properties.axis === 'y') faces[2] = faces[3] = faces[4] = faces[5] = false
      if (properties.axis === 'z') faces[0] = faces[1] = faces[4] = faces[5] = false
    }

    if (properties.half === 'upper') return []
    if (properties.half === 'top' || properties.type === 'top') faces[0] = faces[1] = false
    if (properties.half === 'bottom' || properties.type === 'bottom') faces[0] = faces[1] = false

    if (properties.facing) {
      const { facing, faceDirection } = this.getFacing(stateId, properties.facing)
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
    const faceDir = [new Vec3(0, -1, 0), new Vec3(0, 1, 0), new Vec3(0, 0, -1),
    new Vec3(0, 0, 1), new Vec3(-1, 0, 0), new Vec3(1, 0, 0)]
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
      if (action.type === ActionType.dig) return true // TODO: check
      if (this.getPossibleDirections(action.state, action.pos).length > 0) return true
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
      return dA - dB
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

