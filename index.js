const Telegraf = require('telegraf')
const moment = require('moment')

const dotenv = require('dotenv')
dotenv.config()

const bot = new Telegraf(process.env.API_KEY)

const MESSAGE_DELETE_HOURS = 36
const CLEAR_INTERVAL = moment.duration(1, 'hour').asMilliseconds()
const ADMIN_ID = 428148796

let store = [] // TODO: persistent cache?

const _deleteMessage = ({ chat_id, message_id }, index) => {
  bot.telegram.deleteMessage(chat_id, message_id)
  store.splice(index, 1)
}

const _recordMessage = ({ message, chat }) => {
  const { message_id } = message
  const { id: chat_id } = chat
  // const { text } = message
  // const { username } = message.from
  store.push({ message_id, chat_id, /* username, text, */ timestamp: moment().toISOString() })
}

const _recordBotReply = ({ message_id, chat }) => {
  const { id: chat_id } = chat
  store.push({ message_id, chat_id, timestamp: moment().toISOString() })
}

const _clearMessages = ({ message, chat, deleteMessage }) => {
  const clone = [...store]
  clone.filter(({ chat_id }) => chat_id === chat.id).forEach(_deleteMessage)
  store = []
  deleteMessage(message.message_id)
}

bot.start(({ reply }) => {
  reply(
    `Hello! this bot automatically deletes messages that are ${MESSAGE_DELETE_HOURS} hours old (requires admin permissions for groups). You can also type /clear to manually clear chat history for this chat.`
  ).then(_recordBotReply)
})

bot.command('clear', _clearMessages)

bot.command('report', ({ message, reply }) => {
  const { id } = message.from
  if (id !== ADMIN_ID) {
    reply('Sorry, only an admin (LY) can use this command.').then(_recordBotReply)
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

bot.on('message', _recordMessage)

bot.launch()

setInterval(() => {
  const now = moment()
  const clone = [...store]
  clone
    .filter(({ timestamp }) =>
      moment(timestamp)
        .add(MESSAGE_DELETE_HOURS, 'seconds')
        .isBefore(now)
    )
    .forEach(_deleteMessage)
}, CLEAR_INTERVAL)
