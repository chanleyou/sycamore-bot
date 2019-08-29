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

  ctx.reply = function(text: string) {
    originalReply(text, options).then(({ message_id, chat }: any) => {
      rpush(message_id, chat.id)
    }).catch(console.log) 
  }
  return next()
}
