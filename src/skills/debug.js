const logger = require('../logger')
const admins = require('../admins')
const colors = require('../colors')

module.exports = (controller, skillData) => {

  controller.hears([/debug message/i], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
    admin = admins.getAdmin(message.user)
    if (!admin) {
      bot.reply(message, "I'm afraid you do not have permission to do that.")
      return
    }

    logger.info(JSON.stringify(message))

    bot.reply(message, {
      text: '',
      attachments: [
        {
          fallback: 'Message details have been written to my log.',
          text: 'Message details have been written to my log.',
          color: colors.default
        }
      ]
    })
  })

  skillData.restrictedCommand('debug a message: include `debug message` in your message')
}
