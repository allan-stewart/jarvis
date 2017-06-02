const logger = require('../logger')
const slackEncoder = require('../slack-encoder')

module.exports = (controller) => {

  controller.hears([/encode base64 (.*)$/i,], ['direct_message','direct_mention'], (bot, message) => {
    let encoded = Buffer.from(slackEncoder.decode(message.match[1])).toString('base64')
    bot.reply(message, slackEncoder.encode(encoded))
  })

  controller.hears([/decode base64 (.*)$/i,], ['direct_message','direct_mention'], (bot, message) => {
    let decoded = Buffer.from(slackEncoder.decode(message.match[1]), 'base64').toString('utf8')
    bot.reply(message, slackEncoder.encode(decoded))
  })

  controller.hears([/encode url (.*)$/i,], ['direct_message','direct_mention'], (bot, message) => {
    let encoded = encodeURIComponent(slackEncoder.decode(message.match[1]))
    bot.reply(message, slackEncoder.encode(encoded))
  })

  controller.hears([/decode url (.*)$/i,], ['direct_message','direct_mention'], (bot, message) => {
    let encoded = decodeURIComponent(slackEncoder.decode(message.match[1]))
    bot.reply(message, slackEncoder.encode(encoded))
  })

  logger.info('Loaded slack-users skill')
}
