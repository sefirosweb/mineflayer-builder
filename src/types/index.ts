import { Vec3 } from "vec3"
import { Bot as MineflayerBot } from 'mineflayer'
import { Build } from '../../lib/Build'

export interface Bot extends MineflayerBot {
    test: {
        groundY: number,
        sayEverywhere: (msg: string) => void
        clearInventory: () => void
        becomeSurvival: () => void
        becomeCreative: () => void
        fly: (delta: Vec3) => Promise<void>
        resetState: () => Promise<void>
        placeBlock: (slot: number, position: Vec3) => void
        wait: (ms: number) => Promise<void>
    },
    builder: Builder
}

export type Builder = {
    stop: () => void
    pause: () => void
    continue: () => void
    build: (build: Build) => void
}

declare module 'mineflayer' {
    interface Bot {
        builder: Builder
    }
}