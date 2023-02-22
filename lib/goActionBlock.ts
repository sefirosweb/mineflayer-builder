import { goals, Movements } from "mineflayer-pathfinder"
import { Action, ActionType } from "../types"
import { bot } from './Builder'

export const blockForPlace = ['stone', 'cobblestone', 'dirt', 'andesite', 'diorite', 'granite', 'grass_block']

export const goActionBlock = async (build: any, action: Action) => {
    const movements = new Movements(bot, bot.registry)
    movements.canDig = false
    movements.maxDropDown = 10
    movements.allowSprinting = false
    let goal
    if (action.type === ActionType.place) {
        const properties = build.properties[action.state]
        const { facing, is3D } = build.getFacing(action.state, properties.facing)
        let faces = build.getPossibleDirections(action)
        const half = properties.half ? properties.half : properties.type
        goal = new goals.GoalPlaceBlock(action.pos, bot.world, {
            faces,
            facing: facing,
            facing3D: is3D,
            half,
            range: 3,
            LOS: true
        })
    } else {
        goal = new goals.GoalNear(action.pos.x, action.pos.y, action.pos.z, 3)
    }

    bot.pathfinder.setMovements(movements)
    await bot.pathfinder.goto(goal)

}
