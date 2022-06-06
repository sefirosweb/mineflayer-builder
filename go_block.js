const { goals, Movements } = require('mineflayer-pathfinder')

module.exports = function (bot) {
    const mcData = require('minecraft-data')(bot.version)
    const movements = new Movements(bot, mcData)
    movements.digCost = 10
    movements.maxDropDown = 3
    bot.pathfinder.searchRadius = 10

    async function goBlock(position) {
        const block = bot.blockAt(position)

        const goal = new goals.GoalBlock(position)
        await bot.pathfinder.goto(goal)
    }


    return {
        goBlock,
    }
}
