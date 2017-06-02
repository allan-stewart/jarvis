const logger = require('../logger')
const slackEncoder = require('../slack-encoder')

module.exports = (controller) => {

  controller.hears([/encode base64 (.*)$/i,], ['direct_message','direct_mention'], (bot, message) => {
    transform(bot, message, message.match[1], x => Buffer.from(x).toString('base64'))
  })

  controller.hears([/decode base64 (.*)$/i,], ['direct_message','direct_mention'], (bot, message) => {
    transform(bot, message, message.match[1], (x) => Buffer.from(x, 'base64').toString('utf8'))
  })

  controller.hears([/encode url (.*)$/i,], ['direct_message','direct_mention'], (bot, message) => {
    transform(bot, message, message.match[1], encodeURIComponent)
  })

  controller.hears([/decode url (.*)$/i,], ['direct_message','direct_mention'], (bot, message) => {
    transform(bot, message, message.match[1], decodeURIComponent)
  })

  logger.info('Loaded slack-users skill')
}

const transform = (bot, message, match, transformer) => {
  logger.info('transforming', match)
  var result = transformer(slackEncoder.decode(match))
  bot.reply(message, slackEncoder.encode(result))
}
