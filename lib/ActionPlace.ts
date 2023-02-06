//@ts-nocheck
import { Bot } from "mineflayer"
import { goals, Movements } from "mineflayer-pathfinder"
import { Action } from "../types"
import { getSecondBlock } from "./ChestHelper"
import { equipItem, wait } from "./helper"
import mcDataLoader from 'minecraft-data'
import interactable from "./interactable"


const placementRange = 3
const placementLOS = true
const materialMin = 0

export const actionPlace = async (bot: Bot, build: any, action: Action, fast: boolean) => {
    const mcData = mcDataLoader(bot.version)
    const movements = new Movements(bot, mcData)
    movements.canDig = false
    movements.maxDropDown = 10
    movements.allowSprinting = false


    const item = build.getItemForState(action.state)
    if (bot.inventory.items().length > 30) {
        bot.chat('/clear')
        await wait(1000, fast)
    }
    const amountItem = bot.inventory.count(item.id)

    if (amountItem === 0) {
        await bot.chat('/give builder ' + item.name + ' 2')
        await wait(1000, fast)
    }

    // console.log('Selecting ' + item.displayName)

    const properties = build.properties[action.state]
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

    bot.pathfinder.setMovements(movements)
    await bot.pathfinder.goto(goal)

    const amount = bot.inventory.count(item.id)
    if (amount <= materialMin) throw Error('no_blocks')
    await equipItem(bot, item.id) // equip item after pathfinder

    const faceAndRef = goal.getFaceAndRef(bot.entity.position.floored().offset(0.5, 1.6, 0.5))
    if (!faceAndRef) {
        throw new Error('no face and ref')
    }

    await bot.lookAt(faceAndRef.to, fast)

    const refBlock = bot.blockAt(faceAndRef.ref)
    const sneak = interactable.indexOf(refBlock.name) > 0
    const delta = faceAndRef.to.minus(faceAndRef.ref)

    if (sneak) bot.setControlState('sneak', true)
    await bot._placeBlockWithOptions(refBlock, faceAndRef.face.scaled(-1), { half, delta })
    if (sneak) bot.setControlState('sneak', false)
    await wait(200, fast)

    const blockFacingTo = bot.blockAt(action.pos)._properties?.facing
    if (blockFacingTo) {
        console.log(blockFacingTo)
    }
    // Does not work for 1.12 as blocks dont have the stateId property

    if (properties.facing !== blockFacingTo) {
        console.log('Wrong facing block', properties)
        console.log('got', blockFacingTo)

        await wait(200)
        await digBlock(action.pos)
        await wait(200)

        const faceDirOffset = faceDir[properties.facing]
        const newPosition = action.pos.offset(faceDirOffset.x, faceDirOffset.y, faceDirOffset.z)
        const newGoal = new goals.GoalBlock(newPosition.x, newPosition.y, newPosition.z)
        await bot.pathfinder.goto(newGoal)

        await wait(500)

    }
}