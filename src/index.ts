import Telegraf from 'telegraf'
const Telegram = require('telegraf/telegram')
import dotenv from 'dotenv'
import { CLEAR_INTERVAL } from './constants'
import { recordMiddleware, replyMiddleware } from './middleware'
import {
  clearChatMessages,
  deleteOldMessages,
  report,
  instructions,
} from './functions'

if (process.env.NODE_ENV === 'development') dotenv.config()

export const bot = new Telegraf(process.env.API_KEY)
export const telegram = new Telegram(process.env.API_KEY)

bot.on('message', recordMiddleware)
bot.use(replyMiddleware)
bot.command('clear', clearChatMessages)
bot.command('report', report)
bot.start(instructions)
bot.help(instructions)
bot.launch()

setInterval(deleteOldMessages, CLEAR_INTERVAL.asMilliseconds())
