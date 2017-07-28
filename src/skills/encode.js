const slackEncoder = require('../slack-encoder')

module.exports = (controller, skillData) => {

  controller.hears([/base64 encode (.*)$/i,], ['direct_message','direct_mention'], (bot, message) => {
    transform(bot, message, message.match[1], x => Buffer.from(x).toString('base64'))
  })

  controller.hears([/base64 decode (.*)$/i,], ['direct_message','direct_mention'], (bot, message) => {
    transform(bot, message, message.match[1], (x) => Buffer.from(x, 'base64').toString('utf8'))
  })

  controller.hears([/url encode (.*)$/i,], ['direct_message','direct_mention'], (bot, message) => {
    transform(bot, message, message.match[1], encodeURIComponent)
  })

  controller.hears([/url decode (.*)$/i,], ['direct_message','direct_mention'], (bot, message) => {
    transform(bot, message, message.match[1], decodeURIComponent)
  })

  skillData.publicCommand('encode/decode: `<url|base64> <encode|decode> <string>`')
}

const transform = (bot, message, match, transformer) => {
  var result = transformer(slackEncoder.decode(match))
  bot.reply(message, slackEncoder.encode(result))
}
