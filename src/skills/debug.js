const logger = require('../logger')

module.exports = (controller, skillData) => {

  controller.hears([/debug message/], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
    logger.info(JSON.stringify(message))

    bot.reply(message, {
      text: '',
      attachments: [
        {
          fallback: 'Message details have been written to my log.',
          text: 'Message details have been written to my log.',
          color: '#add8e6'
        }
      ]
    })
  })

  skillData.restrictedCommand('debug a message: include `debug message` in your message')

  logger.info('Loaded debug skill')
}
