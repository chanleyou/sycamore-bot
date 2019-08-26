const Telegraf = require('telegraf')

const bot = new Telegraf('775734716:AAE6_n7gg045GDpCtDH6_vugPpXfKGYG8Fo')

bot.start(ctx => {
  ctx.reply('Bot starting...')
})

bot.hears('/clear', ctx => {
  const { message_id: id } = ctx.message

  for (let i = 0; i < id; i++) {
    ctx.deleteMessage(ctx.chat.id, id).then(console.log, console.log)
  }

  ctx.reply('Clearing...')
})

bot.launch()

console.log('Starting!')
