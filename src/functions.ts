import moment from 'moment'
import { Context } from './types'
import { cache, telegram } from '.'
import { MESSAGE_DELETE_TIMEOUT, CLEAR_INTERVAL } from './constants'

export const llen = () => {
  return new Promise((resolve, reject) => {
    cache.llen('store', (e, len) => {
      if (e) return reject(e)
      return resolve(len)
    })
  })
}

export const lindex = (i: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    cache.lindex('store', i, (e, message) => {
      if (e) return reject(e)
      if (message == null) {
        return reject(new Error(`No message found at index '${i}'.`))
      }
      return resolve(message)
    })
  })
}

export const lpop = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    cache.lpop('store', (e, message) => {
      if (e) reject(e)
      if (message == null) reject(new Error('List empty.'))
      return resolve(message)
    })
  })
}

export const clearChatMessages = async (ctx: Context) => {
  const { chat } = ctx
  const { id } = chat

  const length = await llen()

  const toRemove: string[] = []

  for (let i = 0; i < length; i++) {
    let message
    try {
      message = await lindex(i)
    } catch (e) {
      console.log(e)
    }
    if (message == null) continue
    const [message_id, chat_id] = message.split(',')
    if (chat_id === id.toString()) {
      try {
        telegram.deleteMessage(chat_id, parseInt(message_id))
      } catch (e) {
        console.log(e)
      } finally {
        toRemove.push(message)
      }
    }
  }

  toRemove.forEach(message => cache.lrem('store', 1, message))
}

export const clearOldMessages = async () => {
  const now = moment()

  while (true) {
    let message
    try {
      message = await lpop()
    } catch (e) {
      if (e.message === 'List empty.') return
      console.log(e)
      return
    }

    if (message == null) return

    const [message_id, chat_id, timestamp] = message.split(',')

    if (
      moment(timestamp)
        .add(MESSAGE_DELETE_TIMEOUT)
        .isSameOrAfter(now)
    ) {
      cache.lpush('store', message)
      return
    }

    try {
      telegram.deleteMessage(chat_id, message_id)
    } catch (e) {
      console.log(e)
    }
  }
}

export const report = ({ message, reply }: Context) => {
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

export const instructions = ({ message, reply }: Context) => {
  const deleteTimeout = MESSAGE_DELETE_TIMEOUT.asHours()
  const deleteUnit = deleteTimeout === 1 ? 'hour' : 'hours'
  const clearInterval = CLEAR_INTERVAL.asHours()
  const clearUnit = clearInterval === 1 ? 'hour' : 'hours'
  reply(
    `Hello! Sycamore Bot automatically deletes messages older than ${deleteTimeout} ${deleteUnit} every ${clearInterval} ${clearUnit}.\n\n<b>Commands:</b>\n • <code>/clear</code> delete all messages\n • <code>/help</code>`,
    {
      parse_mode: 'HTML',
      reply_to_message_id: message.message_id,
    }
  )
}
