import assert from 'assert'
import { Vec3 } from 'vec3'
import { sleep, onceWithCleanup } from './promise_utils'
import { Block } from 'prismarine-block'
import { Bot } from '../../src/types';

export default (bot: Bot) => {
    const gameModeChangedMessages = ['commands.gamemode.success.self', 'gameMode.changed']

    let grassName: string
    if (bot.supportFeature('itemsAreNotBlocks')) {
        grassName = 'grass_block'
    } else if (bot.supportFeature('itemsAreAlsoBlocks')) {
        grassName = 'grass'
    } else {
        grassName = 'grass'
    }

    const layerNames = [
        'bedrock',
        'dirt',
        'dirt',
        grassName,
        'air',
        'air',
        'air',
        'air',
        'air',
        'air',
        'air',
        'air',
        'air',
        'air',
        'air',
        'air',
        'air',
        'air',
        'air',
        'air',
        'air'
    ]

    const resetBlocksToSuperflat = async () => {
        const groundY = 0
        for (let y = groundY + 20; y >= groundY - 1; y--) {
            const realY = y + bot.test.groundY - 4
            bot.chat(`/fill ~-50 ${realY} ~-50 ~50 ${realY} ~50 ` + layerNames[y])
        }
        bot.chat(`/fill 0 ${bot.test.groundY - 1} 0 0 ${bot.test.groundY - 1} 0 minecraft:gold_block`)
        await bot.test.wait(100)
    }

    const placeBlock = async (slot: number, position: Vec3) => {
        bot.setQuickBarSlot(slot - 36)
        const referenceBlock = bot.blockAt(position.plus(new Vec3(0, -1, 0))) as Block
        return bot.placeBlock(referenceBlock, new Vec3(0, 1, 0))
    }

    const resetState = async () => {
        await teleport(new Vec3(0, bot.test.groundY + 3, 0))
        await bot.test.wait(1000)
        bot.chat('/weather clear 999999')
        bot.chat('/time set day')
        bot.chat('/gamerule doMobLoot false')
        bot.chat('/kill @e[type=!player]')
        bot.chat('/gamerule doMobLoot true')
        bot.chat('/gamerule randomTickSpeed 20')
        await becomeCreative()
        await clearInventory()
        bot.creative.startFlying()
        await bot.waitForChunksToLoad()
        await resetBlocksToSuperflat()
        await sleep(1000)
        await clearInventory()
        bot.creative.stopFlying()
        await becomeSurvival()
    }

    const becomeCreative = () => {
        return setCreativeMode(true)
    }

    const becomeSurvival = () => {
        return setCreativeMode(false)
    }

    const setCreativeMode = (value: boolean) => {
        const getGM = (val: boolean) => val ? 'creative' : 'survival'
        let i = 0
        const msgProm = onceWithCleanup(bot, 'message', {
            checkCondition: (msg) => gameModeChangedMessages.includes(msg.translate) && i++ > 0 && bot.game.gameMode === getGM(value)
        })

        bot.chat(`/gamemode ${getGM(value)}`)
        bot.chat(`/gamemode ${getGM(!value)}`)
        bot.chat(`/gamemode ${getGM(value)}`)
        return msgProm
    }

    const clearInventory = async () => {
        const msgProm = onceWithCleanup(bot, 'message', { checkCondition: msg => msg.translate === 'commands.clear.success.single' || msg.translate === 'commands.clear.success' })
        bot.chat(`/give ${bot.username} stone 1`)

        const inventoryClearedProm = Promise.all(
            bot.inventory.slots
                .filter(item => item)
                .map(item => onceWithCleanup(bot.inventory, `updateSlot:${item.slot}`, { checkCondition: (oldItem, newItem) => newItem === null })))

        bot.chat('/clear')
        await msgProm
        await inventoryClearedProm
        assert.strictEqual(bot.inventory.slots.filter(i => i).length, 0)
    }

    const teleport = async (position: Vec3) => {
        bot.chat(`/execute as ${bot.username} in minecraft:overworld run teleport ${position.x} ${position.y} ${position.z}`)

        return onceWithCleanup(bot, 'move', {
            checkCondition: () => bot.entity.position.distanceTo(position) < 0.9
        })
    }

    const sayEverywhere = (message: string) => {
        bot.chat(message)
        console.log(message)
    }

    const fly = (delta: Vec3): Promise<void> => {
        return bot.creative.flyTo(bot.entity.position.plus(delta))
    }

    let tallWorld = true
    try {
        tallWorld = bot.supportFeature('tallWorld')
    } catch (e) {
        tallWorld = false
    }

    const wait = async (ms: number): Promise<void> => {
        return new Promise((resolve) => { setTimeout(resolve, ms) })
    }

    bot.test = {
        groundY: tallWorld ? -60 : 4,
        sayEverywhere,
        clearInventory,
        becomeSurvival,
        becomeCreative,
        fly,
        resetState,
        placeBlock,
        wait,
    }
}
