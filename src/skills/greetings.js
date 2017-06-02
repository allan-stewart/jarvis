const logger = require('../logger')
const version = require('../../package.json').version
const admins = require('../admins')

module.exports = (controller, skillData) => {

  controller.hears([/hello/i, /greetings/i], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
    let admin = admins.getAdmin(message.user)
    let text = admin ? `Greetings, ${admin.honorific}.` : `Greetings`
    bot.reply(message, text)
  })

  controller.hears([/are you (up|online)/i], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
    let admin = admins.getAdmin(message.user)
    let text = admin ? `For you, ${admin.honorific}, always.` : `Indeed. It appears I am currently operational.`
    bot.reply(message, text)
  })

  logger.info('Loaded greetings skill')
}
