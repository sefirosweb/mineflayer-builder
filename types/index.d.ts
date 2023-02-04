type Vec3 = import("vec3").Vec3

type Action = {
    pos: Vec3
} & (
        {
            state: number
            type: 'place'
        } |
        {
            state?: never
            type: 'dig'
        })

type Coordinates = 'north' | 'south' | 'east' | 'west'

type Facing = 'up' | 'down' | Coordinates

type BlockProperty = {
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