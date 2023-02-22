import { Bot } from "mineflayer"
import { Vec3 } from "vec3"

export const wait = (ms: number, fast?: boolean) => { return new Promise(resolve => setTimeout(resolve, fast ? 0 : ms)) }

export const faceDir = {
    down: new Vec3(0, -1, 0),
    up: new Vec3(0, 1, 0),
    south: new Vec3(0, 0, 1),
    north: new Vec3(0, 0, -1),
    east: new Vec3(1, 0, 0),
    west: new Vec3(-1, 0, 0)
}


export const equipItem = async (bot: Bot, id_item: number) => {
    if (bot.heldItem?.type === id_item) return
    const item = bot.inventory.findInventoryItem(id_item, null, true)
    if (!item) {
        throw Error('No items to equip')
    }
    await bot.equip(item.type, 'hand')
}
