import { bot } from '../hooks'

describe('01_basic', () => {
    let Y = 4
    before(async () => {
        Y = bot.test.groundY
        await bot.test.resetState()

    })

    it('Test', async (): Promise<void> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, 4000)
        })
    })

    after(() => {
    })

})
