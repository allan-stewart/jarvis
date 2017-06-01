const logger = require('../logger')

module.exports = (controller) => {

  controller.hears([/encode base64 (.*)$/i,], ['direct_message','direct_mention'], (bot, message) => {
    let encoded = Buffer.from(message.match[1]).toString('base64')
    bot.reply(message, encoded)
  })

  controller.hears([/decode base64 (.*)$/i,], ['direct_message','direct_mention'], (bot, message) => {
    let decoded = Buffer.from(message.match[1], 'base64').toString('utf8')
    bot.reply(message, decoded)
  })

  logger.info('Loaded slack-users skill')
}
