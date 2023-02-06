//@ts-nocheck
import { Bot } from "mineflayer"
import { goals, Movements } from "mineflayer-pathfinder"
import { Action } from "../types"
import mcDataLoader from 'minecraft-data'


export const blockForPlace = ['stone', 'cobblestone', 'dirt', 'andesite', 'diorite', 'granite', 'grass_block']

export const goActionBlock = async (bot: Bot, build: any, action: Action) => {
    const mcData = mcDataLoader(bot.version)
    const movements = new Movements(bot, mcData)
    movements.canDig = false
    movements.maxDropDown = 10
    movements.allowSprinting = false


    const properties = build.properties[action.state]
    const { facing, is3D } = build.getFacing(action.state, properties.facing)
    let faces = build.getPossibleDirections(action)
    const half = properties.half ? properties.half : properties.type
    const goal = new goals.GoalPlaceBlock(action.pos, bot.world, {
        faces,
        facing: facing,
        facing3D: is3D,
        half,
        range: 3,
        LOS: true
    })

    bot.pathfinder.setMovements(movements)
    await bot.pathfinder.goto(goal)

}
