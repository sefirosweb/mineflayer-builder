import { Bot } from "mineflayer"
import { goals, Movements } from "mineflayer-pathfinder"
import { Action, blocksCanBeReplaced } from "../types"
import { getSecondBlock } from "./ChestHelper"
import { equipItem, wait } from "./helper"
import interactable from "./interactable"
import { digBlock } from "./digBlock"
import { Item } from "minecraft-data"


const placementRange = 3
const placementLOS = true
const materialMin = 0

export const actionPlace = async (bot: Bot, build: any, action: Action) => {
    const movements = new Movements(bot, bot.registry)
    movements.canDig = false
    movements.maxDropDown = 10
    movements.allowSprinting = false

    const item = action.item as Item
    if (bot.inventory.items().length > 30) {
        bot.chat('/clear')
        await wait(1000)
    }
    const amountItem = bot.inventory.count(item.id, null)

    if (amountItem === 0) {
        bot.chat('/give builder ' + item.name + ' 2')
    }

    // console.log('Selecting ' + item.displayName)

    const properties = action.block.getProperties()
    const half = properties.half ? properties.half : properties.type

    let faces = build.getPossibleDirections(action)

    if (action.block.name === 'chest' && action.block.getProperties().type !== 'single') {
        const { type, facing } = action.block.getProperties()
        const secondBlockChestPos = getSecondBlock(facing, type)
        if (bot.blockAt(action.pos.plus(secondBlockChestPos))?.name === 'chest') {
            const foundSecondBlock = faces.find(f => f.equals(secondBlockChestPos))
            if (foundSecondBlock) {
                faces = [foundSecondBlock]
            }

        }
    }

    const { facing, is3D } = build.getFacing(action.state, properties.facing)
    const goal = new goals.GoalPlaceBlock(action.pos, bot.world, {
        faces,
        facing: facing,
        facing3D: is3D,
        half,
        range: placementRange,
        LOS: placementLOS
    })

    const fast = facing === null

    bot.pathfinder.setMovements(movements)
    await bot.pathfinder.goto(goal)

    const amount = bot.inventory.count(item.id, null)
    if (amount <= materialMin) throw Error('no_blocks')

    await equipItem(item.id)

    const faceAndRef = goal.getFaceAndRef(bot.entity.position.floored().offset(0.5, 1.6, 0.5))
    if (!faceAndRef) {
        throw new Error('no face and ref')
    }

    await bot.lookAt(action.pos, fast)

    const currentBlockPos = bot.blockAt(action.pos)?.name
    if (currentBlockPos && !blocksCanBeReplaced.includes(currentBlockPos)) {
        await digBlock(action.pos)
        await wait(200)
    }

    const refBlock = bot.blockAt(faceAndRef.ref)
    const sneak = interactable.indexOf(refBlock.name) > 0
    const delta = faceAndRef.to.minus(faceAndRef.ref)

    if (sneak) {
        bot.setControlState('sneak', true)
        await wait(200)
    }

    await bot._placeBlockWithOptions(refBlock, faceAndRef.face.scaled(-1), { half, delta })

    if (sneak) {
        await wait(150, fast)
        bot.setControlState('sneak', false)
        await wait(150, fast)
    }

    const blockFacingTo = bot.blockAt(action.pos)._properties?.facing

    if (properties.facing !== blockFacingTo) {
        console.log('Wrong facing block', properties)
        console.log('got', blockFacingTo)

        await wait(200)
        await digBlock(action.pos)
        await wait(200)

        await bot.pathfinder.goto(goal)


        await actionPlace(bot, build, action)

    }
}