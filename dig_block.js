module.exports = function (bot) {

    async function digBlock(position) {
        const block = bot.blockAt(position)
        await bot.dig(block)
    }


    return {
        digBlock,
    }
}
