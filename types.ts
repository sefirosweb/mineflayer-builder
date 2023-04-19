import { Block } from "prismarine-block"
import { Vec3 } from "vec3"
import { Item } from 'minecraft-data'

export const blocksCanBeReplaced = ['air', 'cave_air', 'lava', 'water', 'bubble_column', 'seagrass', 'tall_seagrass', 'kelp_plant']

export enum ActionType {
    dig = 'dig',
    place = 'place',
    click = 'click',
    water = 'water',
    lava = 'lava'
}

export type Action = {
    pos: Vec3,
    block: Block
    state: number
    type: ActionType
    item: Item // Refacto when action is dig must be never
}

export type Coordinates = 'north' | 'south' | 'east' | 'west'
export type ChestType = 'single' | 'left' | 'right'

export type Facing = 'up' | 'down' | Coordinates

export type BlockProperty = {
    level?: number
    facing?: Coordinates
    occupied?: boolean
    part?: 'haead' | 'foot'
    waterlogged?: boolean
    type?: 'left' | 'right' | 'top' | 'bottom'

    up?: 'side' | 'low' | 'none ' | boolean
    down?: 'side' | 'low' | 'none ' | boolean
    north?: 'side' | 'low' | 'none ' | boolean
    south?: 'side' | 'low' | 'none ' | boolean
    east?: 'side' | 'low' | 'none ' | boolean
    west?: 'side' | 'low' | 'none ' | boolean

    mode?: 'subtract'
    inverted?: boolean
    power?: number
    powered?: boolean
    delay?: number
    half?: 'bottom' | 'upper' | 'top'
    shape?: 'straight' | 'outer_left' | 'outer_right'
    locked?: boolean
    open?: boolean
    hanging?: boolean
    axis?: 'x' | 'y' | 'z'
}