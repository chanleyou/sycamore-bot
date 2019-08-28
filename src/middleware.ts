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
  const originalReply = ctx.reply.bind(ctx)

  ctx.reply = function(...input: any) {
    originalReply(...input).then(({ message_id, chat }: any) => {
      rpush(message_id, chat.id)
    })
  }
  return next()
}
