import moment from 'moment'
import { Context } from './types'
import { telegram } from '.'
import { MESSAGE_DELETE_TIMEOUT, CLEAR_INTERVAL } from './constants'
import cache from './cache'

export const clearChatMessages = (ctx: Context) => {
  const { chat } = ctx
  const { id } = chat
  let length: number
  cache.llen('store', (e, len) => {
    if (e) return
    length = len
  })
  const toRemove: string[] = []
  for (let i = 0; i < length; i++) {
    cache.lindex('store', i, (e, message) => {
      if (e) {
        console.log(e)
        return
      }
      const [message_id, chat_id] = message.split(',')
      if (chat_id === id.toString()) {
        telegram.deleteMessage(chat_id, message_id)
        toRemove.push(message)
      }
    })
  }
  toRemove.forEach(message => cache.lrem('store', 1, message))
}
export const deleteOldMessages = () => {
  ;() => {
    const now = moment()

    let done = false

    while (done === false) {
      cache.llen('store', (e, len) => {
        if (len === 0) {
          return
        }
      })
      cache.lpop('store', (e, message) => {
        if (e) {
          console.log(`Error: ${e}`)
          return
        }
        const [message_id, chat_id, timestamp] = message.split(',')
        if (
          moment(timestamp)
            .add(MESSAGE_DELETE_TIMEOUT)
            .isBefore(now)
        ) {
          telegram.deleteMessage(chat_id, message_id)
        } else {
          cache.lpush('store', message)
          done = true
        }
      })
    }
  }
}
export const report = (ctx: Context) => {
  const { message, reply } = ctx
  const { id } = message.from
  if (id.toString() !== process.env.ADMIN_ID) {
    reply('Sorry, only the big boss can use this command.', {
      reply_to_message_id: message.message_id,
    })
    return
  }
  cache.llen('store', (e, len) => {
    reply(`${len} ${len === 1 ? 'message' : 'messages'} cached.`, {
      reply_to_message_id: message.message_id,
    })
  })
}

export const instructions = (ctx: Context) => {
  ctx.reply(
    `Hello! Sycamore Safety Bot automatically deletes messages (but not pictures, videos, etc.) older than ${MESSAGE_DELETE_TIMEOUT.humanize()} every ${CLEAR_INTERVAL.humanize(
      true
    )}. Alternatively, you can type /clear to delete all messages immediately. The bot requires admin permissions to delete messages in group chats.`
  )
}
