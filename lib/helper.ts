import { Vec3 } from "vec3"

export const wait = (ms: number) => { return new Promise(resolve => setTimeout(resolve, ms)) }

export const faceDir = {
    down: new Vec3(0, -1, 0),
    up: new Vec3(0, 1, 0),
    south: new Vec3(0, 0, 1),
    north: new Vec3(0, 0, -1),
    east: new Vec3(1, 0, 0),
    west: new Vec3(-1, 0, 0)
}
