import { Bot } from "mineflayer"
import { Vec3 } from "vec3"

export default (bot: Bot) => {
    async function digBlock(position: Vec3) {
        const block = bot.blockAt(position)
        if (block === null) return
        await bot.dig(block)
    }

    return {
        digBlock,
    }
}
