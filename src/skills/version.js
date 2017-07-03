const version = require('../../package.json').version
const admins = require('../admins')

module.exports = (controller, skillData) => {

  controller.hears([/version/i], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
    let admin = admins.getAdmin(message.user)
    let text = admin ? `I am currently at ${version}, ${admin.honorific}.` : `I am currently at ${version}`
    bot.reply(message, text)
  })

  skillData.publicCommand('get my current version: `version`')
}
