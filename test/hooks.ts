import { createBot } from 'mineflayer'
import injectCommonTest from './common/testCommon'
import { Bot } from '../src/types';

export const TEST_TIMEOUT_MS = 180000
export let bot: Bot

export const mochaHooks = () => {
    return {
        beforeAll() {
            before((done) => {

                if (bot !== undefined) {
                    done()
                    return
                }

                const begin = () => {
                    bot = createBot({
                        username: 'Builder',
                        host: 'localhost',
                        port: 25565,
                        viewDistance: 'tiny'
                    }) as Bot

                    bot.once('spawn', () => {
                        injectCommonTest(bot)
                        done()
                    })
                }

                begin()
            })
        },

        afterAll() {
            after((done) => {
                bot.quit()
                done()
            })
        }

    }
}