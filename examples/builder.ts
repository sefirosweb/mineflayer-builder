//@ts-nocheck
import { builder, Build } from 'mineflayer-builder'
import { Schematic } from 'prismarine-schematic'
const path = require('path')
const fs = require('fs').promises
const { pathfinder } = require('mineflayer-pathfinder')
const mineflayer = require('mineflayer')
const { Vec3 } = require('vec3')
const mineflayerViewer = require('prismarine-viewer').mineflayer

const bot = mineflayer.createBot({
  host: process.argv[2] || 'localhost',
  port: parseInt(process.argv[3]) || 25565,
  username: process.argv[4] || 'builder',
  password: process.argv[5]
})

bot.loadPlugin(pathfinder)
bot.loadPlugin(builder)

function wait(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)) }

bot.once('spawn', async () => {

  bot.chat('/fill 25 -60 25 -25 -50 -25 air')
  bot.chat('/time set day')

  bot.on('path_update', (r: any) => {
    const path = [bot.entity.position.offset(0, 0.5, 0)]
    for (const node of r.path) {
      path.push({ x: node.x, y: node.y + 0.5, z: node.z })
    }
  })

  while (!bot.entity.onGround) {
    await wait(100)
  }

  bot.on('chat', async (username: string, message: string) => {
    console.info(username, message)
    if (message.startsWith('build')) {
      const [, schematicName] = message.split(' ')
      bot.chat('/fill 25 -60 25 -25 -50 -25 air')
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
  build('chest.schem')
})

async function build(name: string) {
  const schematicName = !name.endsWith('.schem') ? name + '.schem' : name
  const filePath: string = path.resolve(path.join(__dirname, '..', 'schematics', schematicName))
  if (!fileExists(filePath)) {
    bot.chat(`File ${schematicName} not found`)
    return
  }

  const schematic = await Schematic.read(await fs.readFile(filePath), bot.version)
  const at = new Vec3(0, -60, 0)
  // bot.entity.position.floored()
  bot.chat(`Building at ${at.x} ${at.y} ${at.z}`)
  const build = new Build(schematic, bot.world, at)
  bot.chat('/fill 416 122 -324 415 122 -324 minecraft:air')
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

