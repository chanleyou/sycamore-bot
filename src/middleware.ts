import { Composer, ContextMessageUpdate } from 'telegraf'
import { rpush } from './cache'

const recordMiddleware = ({ message, chat }: ContextMessageUpdate, next: Function) => {
  rpush(message.message_id, chat.id)
  next()
}

const replyMiddleware = (ctx: ContextMessageUpdate, next: Function) => {
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
      console.log(e)
    }
  } as any
  next()
}

export const messageMiddleware = Composer.compose([recordMiddleware, replyMiddleware])

export default messageMiddleware
