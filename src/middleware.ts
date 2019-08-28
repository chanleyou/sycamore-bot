import moment from 'moment'
import { Middleware } from './types'
import { cache } from '.'

export const recordMiddleware: Middleware = (ctx, next) => {
  const { message, chat } = ctx
  const { message_id } = message
  const { id: chat_id } = chat
  const timestamp = moment().toISOString()
  cache.rpush('store', [message_id, chat_id, timestamp].join(','))
  next()
}

export const replyMiddleware: Middleware = (ctx, next) => {
  const originalReply = ctx.reply.bind(ctx)

  ctx.reply = function(...input: any) {
    originalReply(...input).then(({ message_id, chat }: any) => {
      const { id: chat_id } = chat
      const timestamp = moment().toISOString()
      cache.rpush('store', [message_id, chat_id, timestamp].join(','))
    })
  }
  return next()
}
