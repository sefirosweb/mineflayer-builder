import mineflayer from 'mineflayer'
import fs from 'fs'
import path from 'path'

const bot = mineflayer.createBot({
    host: process.argv[2] || 'localhost',
    port: parseInt(process.argv[3]) || 25565,
    username: process.argv[4] || 'Builder',
    password: process.argv[5]
})

bot.once('spawn', async () => {

    const itemsByName = bot.registry.itemsByName
    const blocksByStateId = bot.registry.blocksByStateId

    const missingBlocksItem = []
    Object.values(blocksByStateId)
        .forEach(blockByStateId => {

            const blockName = blockByStateId.name
            if (!itemsByName[blockName]) {
                missingBlocksItem.push(blockByStateId)
            }

        })

    const result = missingBlocksItem.map(blockByStateId => blockByStateId.name)

    const uniqueResult = [...new Set(result)];

    const json = JSON.stringify(uniqueResult);

    fs.writeFileSync(path.join(__dirname, 'missing_block_state_items.json'), json, 'utf8');

    bot.end()

})

