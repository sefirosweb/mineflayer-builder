import { builder, Build, Builder } from 'mineflayer-builder'
import { Schematic } from 'prismarine-schematic'
import path from 'path'
import fs from 'fs'
import { pathfinder } from 'mineflayer-pathfinder'
import mineflayer, { Bot } from 'mineflayer'
import { Vec3 } from 'vec3'
import { wait } from '../lib/helper'

type CustomBot = Bot & Builder

const bot = mineflayer.createBot({
  host: process.argv[2] || 'localhost',
  port: parseInt(process.argv[3]) || 25565,
  username: process.argv[4] || 'Builder',
  password: process.argv[5]
}) as CustomBot

bot.loadPlugin(pathfinder)
bot.loadPlugin(builder)



bot.once('spawn', async () => {

  bot.chat('/gamemode creative')
  // bot.chat('/teleport Lordvivi')
  // bot.chat('/fill 25 -60 25 -25 -50 -25 air')
  bot.chat('/time set day')

  bot.on('path_update', (r: any) => {
    const path = [bot.entity.position.offset(0, 0.5, 0)]
    for (const node of r.path) {
      path.push(new Vec3(node.x, node.y + 0.5, node.z))
    }
  })

  while (!bot.entity.onGround) {
    await wait(100)
  }

  bot.on('chat', async (username: string, message: string) => {
    console.info(username, message)
    if (message.startsWith('build')) {
      const [, schematicName] = message.split(' ')
      // bot.chat('/fill 25 -60 25 -25 -50 -25 air')
      bot.chat('/time set day')
      await wait(1000)
      build(schematicName)
    } else if (message === 'stop') {
      bot.builder.stop()
    } else if (message === 'pause') {
      bot.builder.pause()
    } else if (message === 'continue') {
      bot.builder.continue()
    }
  })

  await wait(1000)
  build('test.schem')
})

const build = async (name: string) => {
  const schematicName = !name.endsWith('.schem') ? name + '.schem' : name
  const filePath: string = path.resolve(path.join(__dirname, '..', 'schematics', schematicName))
  if (!fileExists(filePath)) {
    bot.chat(`File ${schematicName} not found`)
    return
  }

  const fileLoaded = fs.readFileSync(filePath)
  const schematic = await Schematic.read(fileLoaded, bot.version)
  const at = new Vec3(0, -60, 0)
  // bot.entity.position.floored()
  bot.chat(`Building at ${at.x} ${at.y} ${at.z}`)
  const build = new Build(bot, schematic, bot.world, at)
  // bot.chat('/fill 416 122 -324 415 122 -324 minecraft:air')
  bot.builder.build(build)
}

async function fileExists(path: string) {
  try {
    await fs.promises.access(path)
    return true
  } catch {
    return false
  }
}

