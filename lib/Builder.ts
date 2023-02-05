//@ts-nocheck
import { Bot } from 'mineflayer'
import interactable from './interactable'
import { wait, faceDir } from './helper'
import { goals, Movements } from 'mineflayer-pathfinder'

import dig_block from './dig_block'
import go_block from './go_block'
import { ActionType } from '../types'

export const builder = (bot: Bot) => {
    if (!bot.pathfinder) {
        throw new Error('pathfinder must be loaded before builder')
    }

    let interruptBuilding = false

    const mcData = require('minecraft-data')(bot.version)
    const Item = require('prismarine-item')(bot.version)

    const { digBlock } = dig_block(bot)
    const { goBlock } = go_block(bot)


    const movements = new Movements(bot, mcData)
    // movements.canDig = false
    movements.digCost = 10
    movements.maxDropDown = 3
    //@ts-ignore
    bot.pathfinder.searchRadius = 10

    //@ts-ignore
    bot.builder = {}

    //@ts-ignore
    bot.builder.currentBuild = null

    async function equipItem(id: number) {
        if (bot.heldItem?.type === id) return
        const item = bot.inventory.findInventoryItem(id, null)
        if (!item) {
            throw Error('no_blocks')
        }
        await bot.equip(item.type, 'hand')
    }

    async function materialCallback(item, noMaterialCallback) {
        if (noMaterialCallback && typeof noMaterialCallback === 'function') {
            const p = new Promise((resolve, reject) => {
                try {
                    noMaterialCallback(item, (data) => {
                        resolve(data)
                    }, (error) => {
                        reject(error)
                    })
                } catch (e) {
                    reject(e)
                }
            })
            try {
                await p
            } catch (e) {
                throw new Error(item.name)
            }
        }
        throw new Error(item.name)
    }

    bot.builder.equipItem = equipItem

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

    bot.builder.build = async (build, noMaterialCallback, options = {}) => {
        let errorNoBlocks
        bot.builder.currentBuild = build

        const placementRange = options.range || 3
        const placementLOS = 'LOS' in options ? options.LOS : true
        const materialMin = options.materialMin || 0

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
                    const item = build.getItemForState(action.state)
                    if (bot.inventory.items().length > 30) {
                        bot.chat('/clear')
                        await wait(1000)
                    }
                    const amountItem = bot.inventory.count(item.id)

                    if (amountItem === 0) {
                        await bot.chat('/give builder ' + item.name + ' 2')
                        await wait(1000)
                    }

                    // console.log('Selecting ' + item.displayName)

                    const properties = build.properties[action.state]
                    const half = properties.half ? properties.half : properties.type

                    const faces = build.getPossibleDirections(action.state, action.pos)
                    for (const face of faces) {
                        const block = bot.blockAt(action.pos.plus(face))
                        console.log(face, action.pos.plus(face), block.name)
                    }

                    const { facing, is3D } = build.getFacing(action.state, properties.facing)
                    const goal = new goals.GoalPlaceBlock(action.pos, bot.world, {
                        faces,
                        facing: facing,
                        facing3D: is3D,
                        half,
                        range: placementRange,
                        LOS: placementLOS
                    })
                    if (!goal.isEnd(bot.entity.position.floored())) {
                        // console.log('pathfinding')
                        bot.pathfinder.setMovements(movements)
                        await bot.pathfinder.goto(goal)
                        // console.log('finished pathing')
                    }

                    try {
                        const amount = bot.inventory.count(item.id)
                        if (amount <= materialMin) throw Error('no_blocks')
                        await equipItem(item.id) // equip item after pathfinder
                    } catch (e) {
                        if (e.message === 'no_blocks') {
                            try {
                                await materialCallback(item, noMaterialCallback)
                            } catch (e) {
                                console.info('Throwing error no material')
                                throw Error('cancel')
                            }
                            continue
                        }
                        throw e
                    }

                    // TODO: const faceAndRef = goal.getFaceAndRef(bot.entity.position.offset(0, 1.6, 0))
                    const faceAndRef = goal.getFaceAndRef(bot.entity.position.floored().offset(0.5, 1.6, 0.5))
                    if (!faceAndRef) { throw new Error('no face and ref') }

                    // console.log(faceAndRef)
                    bot.lookAt(faceAndRef.to, true)

                    const refBlock = bot.blockAt(faceAndRef.ref)
                    const sneak = interactable.indexOf(refBlock.name) > 0
                    const delta = faceAndRef.to.minus(faceAndRef.ref)
                    if (sneak) bot.setControlState('sneak', true)
                    await bot._placeBlockWithOptions(refBlock, faceAndRef.face.scaled(-1), { half, delta })
                    if (sneak) bot.setControlState('sneak', false)

                    // const block = bot.world.getBlock(action.pos)
                    const worldState = bot.world.getBlockStateId(action.pos)
                    const blockFacingTo = bot.blockAt(action.pos)._properties?.facing
                    if (blockFacingTo) {
                        console.log(blockFacingTo)
                    }
                    // Does not work for 1.12 as blocks dont have the stateId property

                    if (properties.facing !== blockFacingTo) {
                        console.log('Wrong facing block', properties)
                        console.log('got', blockFacingTo)
                        await wait(500)
                        await digBlock(action.pos)

                        const faceDirOffset = faceDir[properties.facing]
                        const newPosition = action.pos.offset(faceDirOffset.x, faceDirOffset.y, faceDirOffset.z)

                        await wait(500)
                        await goBlock(newPosition)
                    } else {
                        build.removeAction(action)
                    }
                } else if (action.type === ActionType.dig) {
                    await bot.pathfinder.goto(new goals.Goal(action.pos.x, action.pos.y, action.pos))
                    await digBlock(action.pos)
                    await wait(500)
                    build.removeAction(action)
                } else {
                    build.removeAction(action)
                }

            } catch (e) {
                if (e?.name === 'NoPath') {
                    console.info('Skipping unreachable action', action)
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
                } else {
                    console.log(e?.name, e)
                }

                await wait(1000)

                build.removeAction(action)
            }

        } while (true)

        if (errorNoBlocks) {
            const message = 'Failed to build no blocks left ' + errorNoBlocks
            bot.chat(message)
            bot.emit('builder_cancel', message)
        } else {
            bot.chat('Finished building')
            setTimeout(() => {
                bot.emit('builder_finished')
            }, 0)
        }
        bot.builder.currentBuild = null
    }
}