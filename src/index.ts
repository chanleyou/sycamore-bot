import Telegraf from 'telegraf'
import redis from 'redis'
const Telegram = require('telegraf/telegram')
import dotenv from 'dotenv'
import { CLEAR_INTERVAL } from './constants'
import { recordMiddleware, replyMiddleware } from './middleware'
import {
  clearChatMessages,
  clearOldMessages,
  report,
  instructions,
} from './functions'

if (process.env.NODE_ENV === 'development') dotenv.config()

export const cache = redis.createClient(process.env.REDIS_URL)

export const bot = new Telegraf(process.env.API_KEY)
export const telegram = new Telegram(process.env.API_KEY)

bot.on('message', recordMiddleware)
bot.use(replyMiddleware)
bot.command('clear', clearChatMessages)
bot.command('report', report)
bot.start(instructions)
bot.help(instructions)
bot.launch()

setInterval(clearOldMessages, CLEAR_INTERVAL.asMilliseconds())

console.log('~~~ Initialized ~~~')
