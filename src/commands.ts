/* eslint @typescript-eslint/no-use-before-define: 0 */
import moment from 'moment'
import { ContextMessageUpdate } from 'telegraf'
import { telegram } from '.'
import { lrem, lpush, lrange, lpop, llen } from './cache'
import { MESSAGE_DELETE_TIMEOUT, CLEAR_INTERVAL } from './constants'

const commands = {
  start: instructions,
  help: instructions,
  clear: clearChatMessages,
  shouldi: decide,
  goodbot: goodBot,
  badbot: badBot,
  report,
}

const deleteMessage = (chat_id: string | number, message_id: number) =>
  telegram.deleteMessage(chat_id, message_id).catch(console.log)

async function clearChatMessages(ctx: ContextMessageUpdate) {
  const { chat } = ctx
  const { id } = chat

  const messages = await lrange()

  messages.forEach(async message => {
    const [message_id, chat_id] = message.split(',')
    if (chat_id === id.toString()) {
      try {
        await deleteMessage(chat_id, parseInt(message_id, 10))
        lrem(message)
      } catch (e) {
        console.log(e)
      }
    }
  })
}

export async function clearOldMessages() {
  const now = moment()
  let message = await lpop()

  while (message != null) {
    const [message_id, chat_id, timestamp] = message.split(',')
    if (
      moment(timestamp)
        .add(MESSAGE_DELETE_TIMEOUT)
        .isSameOrAfter(now)
    ) {
      lpush(message)
      return
    }
    deleteMessage(chat_id, parseInt(message_id, 10))
    message = await lpop() // eslint-disable-line no-await-in-loop
  }
}

async function report({ message, reply }: ContextMessageUpdate) {
  const { id } = message.from
  if (id.toString() !== process.env.ADMIN_ID) {
    reply('Sorry, only big boss can use this command.')
    return
  }
  const length = await llen()
  reply(`${length} ${length === 1 ? 'message' : 'messages'} cached.`)
}

function instructions({ reply }: ContextMessageUpdate) {
  const deleteTimeout = MESSAGE_DELETE_TIMEOUT.asHours()
  const deleteUnit = deleteTimeout === 1 ? 'hour' : 'hours'
  const clearInterval = CLEAR_INTERVAL.asHours()
  const clearUnit = clearInterval === 1 ? 'hour' : 'hours'

  const commandsMarkdown = Object.keys(commands)
    .map(key => ` • <code>${key}</code>`)
    .join('\n')

  reply(
    `Hello! Sycamore Bot automatically deletes messages older than ${deleteTimeout} ${deleteUnit} every ${clearInterval} ${clearUnit}.\n\n<b>Commands:</b>\n${commandsMarkdown}`,
  )
}

function decide({ message, reply }: ContextMessageUpdate) {
  let { text } = message
  while (text.match(/[.?! ]$/)) text = text.slice(0, text.length - 1)

  if (text.split(' ').length === 1) {
    const random = Math.random() < 0.5
    if (random) return reply('Yes, do it!')
    return reply("No, don't do it...")
  }

  const choices = text
    .split(' ')
    .reduce(
      (acc, word) => {
        if (word.toLowerCase() === '/shouldi') return acc
        if (word.toLowerCase() === 'or') return [...acc, []]
        const clone = [...acc]
        clone[clone.length - 1].push(word)
        return clone
      },
      [[]],
    )
    .map(sentence => sentence.join(' '))

  if (choices.length === 1) {
    const decision = Math.random() < 0.5 ? 'Yes, I think you should' : "No, you shouldn't"
    return reply(`${decision} ${choices[0]}.`)
  }

  const suggestion = choices[Math.floor(Math.random() * choices.length)]
  return reply(`I think you should ${suggestion}!`)
}

function badBot({ message, reply }: ContextMessageUpdate) {
  const { first_name } = message.from
  reply(`😭 UwU I'm sowwy ${first_name}... I've been a bad bot please punish me UwU 😭`)
}

function goodBot({ message, reply }: ContextMessageUpdate) {
  const { first_name } = message.from
  reply(`😊 Thanks ${first_name}! 😊`)
}

type Command = keyof typeof commands

export const isCommand = (key: string): key is Command => key in commands

export default commands
