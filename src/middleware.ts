import moment from 'moment'
import { Middleware } from './types'
import { cache } from '.'

export const rpush = (
  message_id: string | number,
  chat_id: string | number
) => {
  const timestamp = moment().toISOString()
  cache.rpush('store', [message_id, chat_id, timestamp].join(','))
}

export const recordMiddleware: Middleware = ({ message, chat }, next) => {
  rpush(message.message_id, chat.id)
  next()
}

export const replyMiddleware: Middleware = (ctx, next) => {
  const { message } = ctx
  const originalReply = ctx.reply.bind(ctx)
  const options = {
    parse_mode: 'HTML',
    reply_to_message_id: message.message_id,
  }

  ctx.reply = async function(text: string) {
    try {
      const reply = await originalReply(text, options)
      if (reply == null) return
      const { message_id, chat } = reply
      rpush(message_id, chat.id)
    } catch (e) {
      console.log(`Error: ${e}`)
    } 
  }
  next()
}
