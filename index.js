const Telegraf = require('telegraf')
const moment = require('moment')
const dotenv = require('dotenv')

dotenv.config()

const bot = new Telegraf('775734716:AAE6_n7gg045GDpCtDH6_vugPpXfKGYG8Fo')

let interval = null
let history = []

const clear = ({ message, deleteMessage }) => {
  history.forEach(({ message_id }) => deleteMessage(message_id))
  history = []
  try {
    deleteMessage(message.id)
  } catch (e) {
    console.log(e)
  }
}

const clearHistory = ({ deleteMessage }) => {
  const clone = [...history]
  clone.forEach(({ message_id, time }) => {
    if (
      moment(time)
        .add(36, 'hours')
        .isBefore(moment())
    ) {
      try {
        deleteMessage(message_id)
      } finally {
        let index = history.findIndex(message => message.message_id === message_id)
        if (index > -1) history.splice(index, 1)
      }
    }
  })
}

bot.start(ctx => {
  if (interval) clearInterval(interval)
  ctx.reply(
    'Sycamore Safety Bot initialized. Chat messages (not pictures, videos, etc.) now self-destruct after 24 hours.\nAlternatively, type /clear to manually clear chat history.'
  )
  interval = setInterval(() => {
    clearHistory(ctx)
  }, moment.duration(1, 'hour').asMilliseconds())
})

bot.hears('/clear', clear)

// bot.hears('/report', ({ message, reply }) => {
//   reply(message)
//   reply(`Reporting: ${history.length} message(s) stored...`)
//   history.forEach(message => {
//     const messageJSON = JSON.stringify(message)
//     reply(messageJSON)
//   })
// })

bot.launch()

bot.on('message', ({ message }) => history.push({ ...message, time: moment().toISOString() }))
