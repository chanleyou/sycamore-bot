import Telegraf, { Telegram } from 'telegraf'
import redis from 'redis'
import dotenv from 'dotenv'
import { CLEAR_INTERVAL } from './constants'
import { messageMiddleware } from './middleware'
import {
  clearChatMessages,
  clearOldMessages,
  report,
  instructions,
  decide,
  badBot,
  goodBot,
} from './functions'

if (process.env.NODE_ENV === 'development') dotenv.config()

export const cache = redis.createClient(process.env.REDIS_URL)
cache.on('error', e => console.log(`Error: ${e}`))

export const bot = new Telegraf(process.env.API_KEY)
export const telegram = new Telegram(process.env.API_KEY)

bot.on('message', messageMiddleware)
bot.command('clear', clearChatMessages)
bot.command('report', report)
bot.command('shouldi', decide)
bot.command('badbot', badBot)
bot.command('goodbot', goodBot)
bot.start(instructions)
bot.help(instructions)
bot.launch()

clearOldMessages()

setInterval(clearOldMessages, CLEAR_INTERVAL.asMilliseconds())

console.log('~~~ Initialized ~~~')
