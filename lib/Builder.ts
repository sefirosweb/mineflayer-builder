//@ts-nocheck
import { Bot } from 'mineflayer'
import { wait, equipItem } from './helper'
import digBlockLoader from './digBlock'
import { ActionType } from '../types'
import { actionPlace } from './ActionPlace'
import { goActionBlock } from './goActionBlock'

export const builder = (bot: Bot) => {
    if (!bot.pathfinder) {
        throw new Error('pathfinder must be loaded before builder')
    }

    let interruptBuilding = false
    const digBlock = digBlockLoader(bot)

    bot.builder = {}

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
        bot.builder.currentBuild?.updateActions()
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
                await wait(1000)
                continue
            }

            checkIsFinished = false

            console.log('action', {
                ...action,
                block: action.block.name
            })

            try {
                if (action.type === ActionType.place) {
                    await actionPlace(bot, build, action)
                    build.removeAction(action)
                } else if (action.type === ActionType.dig) {
                    await goActionBlock(bot, build, action)
                    await digBlock(action.pos)
                    await wait(500)
                    build.removeAction(action)
                } else if (action.type === ActionType.click) {

                    await goActionBlock(bot, build, action)
                    await bot.lookAt(action.pos)
                    const block = bot.blockAt(action.pos)
                    if (!block) throw Error('Block not found!')
                    await bot.activateBlock(block)
                    await wait(500)
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
                    await wait(1000)
                    continue
                } else if (e?.message.startsWith('no face and ref')) {
                    build.removeAction(action)
                    await wait(1000)
                } else {
                    console.log(e?.name)
                }

                await wait(1000)

                // build.removeAction(action)
            }

        } while (true)

        bot.builder.currentBuild = null
    }
}