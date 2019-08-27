const Telegraf = require('telegraf')
const moment = require('moment')

if (process.env.NODE_ENV === 'development') {
  const dotenv = require('dotenv')
  dotenv.config()
}

const bot = new Telegraf(process.env.API_KEY)

const MESSAGE_DELETE_HOURS = 36
const CLEAR_INTERVAL = moment.duration(1, 'hour').asMilliseconds()
const ADMIN_ID = parseInt(process.env.ADMIN_ID)

let store = [] // TODO: persistent cache between bot restarts

// takes a comparison function with message as arg, deletes all messages that match the condition
const deleteMessages = condition => {
  const deleteArray = []
  store.forEach((message, index) => {
    if (condition(message)) {
      const { message_id, chat_id } = message
      bot.telegram.deleteMessage(chat_id, message_id)
      deleteArray.push(index)
    }
  })

  for (let i = deleteArray.length - 1; i >= 0; i--) {
    store.splice(deleteArray[i], 1)
  }
}

// record the message_id and chat_id of all messages
const recordMiddleware = ({ message, chat }, next) => {
  const { message_id } = message
  const { id: chat_id } = chat
  store.push({ message_id, chat_id, timestamp: moment().toISOString() })
  next()
}

// record outgoing bot reply messages. TODO: middleware for this
const _recordBotReply = ({ message_id, chat }) => {
  const { id: chat_id } = chat
  store.push({ message_id, chat_id, timestamp: moment().toISOString() })
}

// clear all messages from originating chat
const _clearMessages = ({ chat }) => {
  const condition = message => message.chat_id === chat.id
  deleteMessages(condition)
}

bot.on('message', recordMiddleware)

bot.start(({ reply }) => {
  reply(
    `Hello! this bot automatically deletes messages that are ${MESSAGE_DELETE_HOURS} hours old (requires admin permissions for groups). You can also type /clear to manually clear chat history for this chat.`
  ).then(_recordBotReply)
})

bot.command('clear', _clearMessages)

bot.command('report', ({ message, reply }) => {
  const { id } = message.from
  if (id !== ADMIN_ID) {
    reply('Sorry, only big boss can use this command.').then(_recordBotReply)
    return
  }
  reply(`Reporting store: ${store.length} ${store.length === 1 ? 'message' : 'messages'}.`).then(
    _recordBotReply
  )
  store.forEach(message =>
    reply(
      Object.entries(message)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ')
    ).then(_recordBotReply)
  )
})

bot.launch()

// delete all messages >36 hours old every hour
setInterval(() => {
  const now = moment()
  const condition = message =>
    moment(message.timestamp)
      .add(MESSAGE_DELETE_HOURS, 'hours')
      .isBefore(now)
  deleteMessages(condition)
}, CLEAR_INTERVAL)
