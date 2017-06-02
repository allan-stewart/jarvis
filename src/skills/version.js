const logger = require('../logger')
const version = require('../../package.json').version

module.exports = (controller, skillData) => {

  controller.hears([/version/], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
    logger.info(JSON.stringify(message))

    bot.reply(message, {
      text: `My version is currently: ${version}`
    })
  })

  skillData.publicCommand('get my current version: `version`')

  logger.info('Loaded version skill')
}
