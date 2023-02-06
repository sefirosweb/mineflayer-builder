//@ts-nocheck
import { Bot } from 'mineflayer'
import interactable from './interactable'
import { wait, faceDir, equipItem } from './helper'
import { goals, Movements } from 'mineflayer-pathfinder'

import dig_block from './dig_block'
import go_block, { blockForPlace } from './go_block'
import { ActionType } from '../types'
import { getSecondBlock } from './ChestHelper'
import { actionPlace } from './ActionPlace'

const fast = false

export const builder = (bot: Bot) => {
    if (!bot.pathfinder) {
        throw new Error('pathfinder must be loaded before builder')
    }

    let interruptBuilding = false

    const mcData = require('minecraft-data')(bot.version)
    const Item = require('prismarine-item')(bot.version)

    const { digBlock } = dig_block(bot)
    const { goBlock } = go_block(bot)



    //@ts-ignore

    //@ts-ignore
    bot.builder = {}

    //@ts-ignore
    bot.builder.currentBuild = null

    bot.builder.equipItem = (id: number) => equipItem(bot, id)

    bot.builder.stop = function () {
        console.log('Stopped building')
        interruptBuilding = true
        bot.builder.currentBuild = null
        bot.pathfinder.setGoal(null)
    }

    bot.builder.pause = function () {
        console.log('Paused building')
        interruptBuilding = true
        bot.pathfinder.setGoal(null)
    }

    bot.builder.continue = () => {
        bot.builder.currentBuild.updateActions()
        if (!bot.builder.currentBuild) return console.log('Nothing to continue building')
        bot.builder.build(bot.builder.currentBuild)
    }

    bot.builder.build = async (build) => {
        bot.builder.currentBuild = build


        interruptBuilding = false
        let checkIsFinished = false

        do {
            if (interruptBuilding) {
                interruptBuilding = false
                return
            }

            const action = build.getNextAction()

            if (!action) {
                // Last check
                if (checkIsFinished) {
                    console.log('No more actions to do')
                    return
                }

                checkIsFinished = true
                bot.builder.currentBuild.updateActions()
                await wait(1000, fast)
                continue
            }

            checkIsFinished = false

            console.log('action', {
                ...action,
                block: action.block.name
            })

            try {
                if (action.type === ActionType.place) {
                    await actionPlace(bot, build, action, fast)
                    build.removeAction(action)
                } else if (action.type === ActionType.dig) {
                    await bot.pathfinder.goto(new goals.GoalBlock(action.pos.x, action.pos.y, action.pos))
                    await digBlock(action.pos)
                    await wait(500, fast)
                    build.removeAction(action)
                } else if (action.type === ActionType.click) {
                    await bot.pathfinder.goto(new goals.GoalBlock(action.pos.x, action.pos.y, action.pos))
                    const block = bot.blockAt(action.pos)
                    await bot.activateBlock(block)
                    await wait(500, fast)
                    build.removeAction(action)
                }

            } catch (e) {
                if (e?.name === 'NoPath') {
                    console.info('Skipping unreachable action', {
                        ...action,
                        block: action.block.name
                    })
                } else if (e && (e.name === 'cancel' || e.message === 'cancel')) {
                    console.info('Canceling build no materials')
                    break
                } else if (e?.message.startsWith('No block has been placed')) {
                    bot.builder.currentBuild.updateActions()
                    console.info('Block placement failed')
                    console.log(bot.entity.position)
                    console.log(action.pos)
                    console.error(e.message)
                    await wait(1000, fast)
                    continue
                } else if (e?.message.startsWith('no face and ref')) {
                    build.removeAction(action)
                    await wait(1000, fast)
                } else {
                    console.log(e?.name)
                }

                await wait(1000, fast)

                // build.removeAction(action)
            }

        } while (true)

        bot.builder.currentBuild = null
    }
}