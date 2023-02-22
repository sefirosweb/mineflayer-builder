import mc from 'minecraft-protocol'
import path from 'path'
import mcDataLoader from 'minecraft-data'

//@ts-ignore
import { download, Wrap } from 'minecraft-wrap'

const propOverrides = {
    motd: 'Test Minecraft Server',
    'level-type': 'FLAT',
    'spawn-npcs': 'true',
    'spawn-animals': 'true',
    'online-mode': 'false',
    gamemode: '1a',
    'spawn-monsters': 'false',
    'generate-structures': 'false',
    'enable-command-block': 'true',
    'use-native-transport': 'false', // java 16 throws errors without this, https://www.spigotmc.org/threads/unable-to-access-address-of-buffer.311602
    'server-port': 255655,
    'view-distance': '40',
    'pvp': 'true'
}

const MC_SERVER_PATH = path.join(__dirname, 'server')

let PORT = 25565
const supportedVersion = "1.19.2"
const mcData = mcDataLoader(supportedVersion)
const version = mcData.version
const MC_SERVER_JAR_DIR = process.env.MC_SERVER_JAR_DIR || `${process.cwd()}/server_jars`
const MC_SERVER_JAR = `${MC_SERVER_JAR_DIR}/minecraft_server.${version.minecraftVersion}.jar`
const wrap = new Wrap(MC_SERVER_JAR, `${MC_SERVER_PATH}_${supportedVersion}`)

wrap.on('line', (line: string) => {
    console.log(line)
})

download(version.minecraftVersion, MC_SERVER_JAR, (err: Error) => {
    if (err) {
        console.log(err)
        return
    }
    propOverrides['server-port'] = PORT
    wrap.startServer(propOverrides, () => {
        console.log(`pinging ${version.minecraftVersion} port : ${PORT}`)

        const serverConection = {
            port: PORT,
            version: supportedVersion
        }

        mc.ping(serverConection, () => {
            setTimeout(() => {
                console.log('pong')
                wrap.writeServer('op Archer\n')
                wrap.writeServer('op Lordvivi\n')
            }, 10000);
        })
    })
})

