import { Bot } from "mineflayer"
import { Vec3 } from "vec3"
import { wait } from "./helper"
import { goals, Movements } from 'mineflayer-pathfinder'

export const blockForPlace = ['stone', 'cobblestone', 'dirt', 'andesite', 'diorite', 'granite', 'grass_block']

export default (bot: Bot) => {
    const mcData = require('minecraft-data')(bot.version)
    const movements = new Movements(bot, mcData)
    movements.digCost = 10
    movements.maxDropDown = 5
    //@ts-ignore
    bot.pathfinder.searchRadius = 10

    async function goBlock(position: Vec3) {
        const downBlock = bot.blockAt(position.offset(0, -1, 0))
        if (downBlock === null) throw new Error('down block not found!')

        await placeHelperblocks()

        const newPosition = position.offset(0.5, 0, 0.5)
        console.log(newPosition)
        const goal = new goals.GoalBlock(newPosition.x, newPosition.y, newPosition.z)
        await bot.pathfinder.goto(goal)
        await wait(100)
    }

    async function placeHelperblocks() {
        const itemToPlace = bot.inventory.items().find(item => blockForPlace.includes(item.name))
        if (!itemToPlace) {
            throw new Error('No items helper to place')
        }
    }

    return {
        goBlock,
    }
}
