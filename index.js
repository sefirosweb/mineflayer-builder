const { goals, Movements } = require('mineflayer-pathfinder')

const interactable = require('./lib/interactable.json')

function wait (ms) { return new Promise(resolve => setTimeout(resolve, ms)) }

function inject (bot) {
  if (!bot.pathfinder) {
    throw new Error('pathfinder must be loaded before builder')
  }

  const mcData = require('minecraft-data')(bot.version)
  const Item = require('prismarine-item')(bot.version)

  const movements = new Movements(bot, mcData)
  // movements.canDig = false
  movements.digCost = 10
  movements.maxDropDown = 256
  bot.pathfinder.searchRadius = 10

  bot.builder = {}

  async function OldequipItem (id) {
    if (bot.inventory.items().length > 30) {
      bot.chat('/clear')
      await wait(1000)
      const slot = bot.inventory.firstEmptyInventorySlot()
      await bot.creative.setInventorySlot(slot !== null ? slot : 36, new Item(mcData.itemsByName.dirt.id, 1))
    }
    if (!bot.inventory.items().find(x => x.type === id)) {
      const slot = bot.inventory.firstEmptyInventorySlot()
      await bot.creative.setInventorySlot(slot !== null ? slot : 36, new Item(id, 1))
    }
    const item = bot.inventory.items().find(x => x.type === id)
    await bot.equip(item, 'hand')
  }

  async function equipItem (id) {
    await bot.setQuickBarSlot(5)
    const item = bot.inventory.findInventoryItem(id, null)
    if (!item) {
      throw Error('no_blocks')
    }
    await bot.equip(item.type, 'hand')
  }

  bot.builder.equipItem = equipItem

  // /fill ~-20 ~ ~-20 ~20 ~10 ~20 minecraft:air

  bot.builder.build = async (build) => {
    let errorNoBlocks

    while (build.actions.length > 0) {
      const actions = build.getAvailableActions()
      console.log(`${actions.length} available actions`)
      if (actions.length === 0) {
        console.log('No actions to perform')
        break
      }
      actions.sort((a, b) => {
        let dA = a.pos.offset(0.5, 0.5, 0.5).distanceSquared(bot.entity.position)
        dA += (a.pos.y - bot.entity.position.y) * 100
        let dB = b.pos.offset(0.5, 0.5, 0.5).distanceSquared(bot.entity.position)
        dB += (b.pos.y - bot.entity.position.y) * 100
        return dA - dB
      })
      const action = actions[0]
      console.log('action', action)

      try {
        if (action.type === 'place') {
          const item = build.getItemForState(action.state)
          console.log('Selecting ' + item.displayName)

          const properties = build.properties[action.state]
          const half = properties.half ? properties.half : properties.type

          const faces = build.getPossibleDirections(action.state, action.pos)
          for (const face of faces) {
            const block = bot.blockAt(action.pos.plus(face))
            console.log(face, action.pos.plus(face), block.name)
          }

          const { facing, is3D } = build.getFacing(action.state, properties.facing)
          const goal = new goals.GoalPlaceBlock(action.pos, bot.world, {
            faces,
            facing: facing,
            facing3D: is3D,
            half
          })
          if (!goal.isEnd(bot.entity.position.floored())) {
            console.log('pathfinding')
            bot.pathfinder.setMovements(movements)
            await bot.pathfinder.goto(goal)
          }

          try {
            await equipItem(item.id) // equip item after pathfinder
          } catch (e) {
            if (e.message === 'no_blocks') {
              errorNoBlocks = item.name
              break 
            }
            throw e
          }

          // TODO: const faceAndRef = goal.getFaceAndRef(bot.entity.position.offset(0, 1.6, 0))
          const faceAndRef = goal.getFaceAndRef(bot.entity.position.floored().offset(0.5, 1.6, 0.5))
          if (!faceAndRef) { throw new Error('no face and ref') }

          bot.lookAt(faceAndRef.to, true)

          const refBlock = bot.blockAt(faceAndRef.ref)
          const sneak = interactable.indexOf(refBlock.name) > 0
          const delta = faceAndRef.to.minus(faceAndRef.ref)
          if (sneak) bot.setControlState('sneak', true)
          await bot._placeBlockWithOptions(refBlock, faceAndRef.face.scaled(-1), { half, delta })
          if (sneak) bot.setControlState('sneak', false)

          const block = bot.world.getBlock(action.pos)
          if (block.stateId !== action.state) {
            console.log('expected', properties)
            console.log('got', block.getProperties())
          } else {
            build.removeAction(action)
          }
        } else if (action.type === 'dig') {
          await bot.pathfinder.goto(goals.Goal)
          build.removeAction(action)
        }
      } catch (e) {
        console.log(e)
      }
    }

    if (errorNoBlocks) {
      bot.chat('Failed to build no blocks left ' + errorNoBlocks)
    } else {
      bot.chat('Finished building')
    }
  }
}

module.exports = {
  Build: require('./lib/Build'),
  builder: inject
}
