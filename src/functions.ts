import moment from 'moment'
import { Context } from './types'
import { cache, telegram } from '.'
import { MESSAGE_DELETE_TIMEOUT, CLEAR_INTERVAL } from './constants'

export const llen = (): Promise<number> => {
  return new Promise((resolve, reject) => {
    cache.llen('store', (e, len) => {
      if (e) return reject(e)
      return resolve(len)
    })
  })
}

export const lindex = (i: number): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    cache.lindex('store', i, (e, message) => {
      if (e) return reject(e)
      return resolve(message)
    })
  })
}

export const lpop = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    cache.lpop('store', (e, message) => {
      if (e) return reject(e)
      if (message == null) return resolve(null)
      return resolve(message)
    })
  })
}

export const lrange = (
  start: number = 0,
  end: number = -1
): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    cache.lrange('store', start, end, (e, messages) => {
      if (e) return reject(e)
      return resolve(messages)
    })
  })
}

const deleteMessage = (chat_id: string | number, message_id: string | number) =>
  telegram.deleteMessage(chat_id, message_id).catch(console.log)

export const clearChatMessages = async (ctx: Context) => {
  const { chat } = ctx
  const { id } = chat

  const messages = await lrange()

  messages.forEach(message => {
    const [message_id, chat_id] = message.split(',')
    if (chat_id === id.toString()) {
      deleteMessage(chat_id, parseInt(message_id))
      cache.lrem('store', 1, message)
    }
  })
}

export const clearOldMessages = async () => {
  const now = moment()
  let message = await lpop()

  while (message != null) {
    const [message_id, chat_id, timestamp] = message.split(',')
    if (
      moment(timestamp)
        .add(MESSAGE_DELETE_TIMEOUT)
        .isSameOrAfter(now)
    ) {
      cache.lpush('store', message)
      return
    }
    deleteMessage(chat_id, message_id)
    message = await lpop()
  }
}

export const report = async ({ message, reply }: Context) => {
  const { id } = message.from
  if (id.toString() !== process.env.ADMIN_ID) {
    reply('Sorry, only the big boss can use this command.', {
      reply_to_message_id: message.message_id,
    })
    return
  }
  const length = await llen()
  reply(`${length} ${length === 1 ? 'message' : 'messages'} cached.`, {
    reply_to_message_id: message.message_id,
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
