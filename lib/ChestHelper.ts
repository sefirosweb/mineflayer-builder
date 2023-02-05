import { Vec3 } from "vec3"
import { ChestType, Coordinates } from "../types"

export const getSecondBlock = (facing: Coordinates, type: ChestType): Vec3 => {
    if (facing === 'south' && type === 'right') {
        return new Vec3(1, 0, 0)
    }

    if (facing === 'south' && type === 'left') {
        return new Vec3(-1, 0, 0)
    }

    if (facing === 'north' && type === 'left') {
        return new Vec3(1, 0, 0)
    }

    if (facing === 'north' && type === 'right') {
        return new Vec3(-1, 0, 0)
    }

    if (facing === 'east' && type === 'right') {
        return new Vec3(0, 0, -1)
    }

    if (facing === 'east' && type === 'left') {
        return new Vec3(0, 0, 1)
    }

    if (facing === 'west' && type === 'left') {
        return new Vec3(0, 0, -1)
    }

    if (facing === 'west' && type === 'right') {
        return new Vec3(0, 0, 1)
    }

    return new Vec3(0, 0, 0)
}