import { Vec3 } from "vec3"
import { bot } from "./Builder"

export const digBlock = async (position: Vec3) => {
    const block = bot.blockAt(position)
    if (block === null) return
    await bot.dig(block)
}
