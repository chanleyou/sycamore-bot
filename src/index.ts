import Telegraf, { Telegram } from 'telegraf'
import dotenv from 'dotenv'
import { CLEAR_INTERVAL } from './constants'
import middleware from './middleware'
import { clearOldMessages } from './commands'

if (process.env.NODE_ENV === 'development') dotenv.config()

export const bot = new Telegraf(process.env.API_KEY)
export const telegram = new Telegram(process.env.API_KEY)

bot.on('message', middleware)
bot.launch()

clearOldMessages()

setInterval(clearOldMessages, CLEAR_INTERVAL.asMilliseconds())

console.log('~~~ Initialized ~~~')
