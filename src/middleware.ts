import { Composer, ContextMessageUpdate } from 'telegraf'
import commands, { isCommand } from './commands'
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

const commandsMiddleware = (ctx: ContextMessageUpdate): void => {
  const { text } = ctx.message
  const command = text.split(' ')[0].slice(1)

  if (isCommand(command)) commands[command](ctx)
  else {
    const { reply } = ctx
    reply('Unknown command. Type /help to see a list of valid commands.')
  }
}

export const middleware = Composer.compose([recordMiddleware, replyMiddleware, commandsMiddleware])

export default middleware
