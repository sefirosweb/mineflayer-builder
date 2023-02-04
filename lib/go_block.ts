//@ts-nocheck
import { wait } from "./helper"


const { goals, Movements } = require('mineflayer-pathfinder')
const blocksCanBeReplaced = ['air', 'cave_air', 'lava', 'water', 'bubble_column', 'seagrass', 'tall_seagrass', 'kelp_plant']
const blockForPlace = ['stone', 'cobblestone', 'dirt', 'andesite', 'diorite', 'granite', 'grass_block']

export default (bot) => {
    const mcData = require('minecraft-data')(bot.version)
    const movements = new Movements(bot, mcData)
    movements.digCost = 10
    movements.maxDropDown = 3
    bot.pathfinder.searchRadius = 10

    async function goBlock(position) {
        const block = bot.blockAt(position)
        const downBlock = bot.blockAt(position.offset(0, -1, 0))

        await placeHelperblocks(downBlock.position)

        const newPosition = position.offset(0.5, 0, 0.5)
        console.log(newPosition)
        const goal = new goals.GoalBlock(newPosition.x, newPosition.y, newPosition.z)
        await bot.pathfinder.goto(goal)
        await wait(100)
    }

    async function placeHelperblocks(position) {
        const itemToPlace = bot.inventory.items().find(item => blockForPlace.includes(item.name))
        if (!itemToPlace) {
            throw new Error('No items helper to place')
        }

    }

    return {
        goBlock,
    }
}
