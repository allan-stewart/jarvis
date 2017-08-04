const Botkit = require('botkit')
const config = require('./config.json')
const version = require('./package.json').version
const logger = require('./src/logger')
const skillsLoader = require('./src/skills-loader')
const slackInfo = require('./src/slack-info')

logger.setLogLevel(config.logLevel)

logger.info(`Initializing J.A.R.V.I.S. version ${version}`)

const controller = Botkit.slackbot({
  send_via_rtm: true,
  json_file_store: './store'
})

require('./src/admins').load(controller)
require('./src/header-queries').load(controller)
require('./src/rabbit').load(controller)
skillsLoader.load(controller)

let bot = controller.spawn({
  token: config.slackbotToken
});

const startRTM = () => {
  bot.startRTM((error, bot, payload) => {
    if (error) {
      logger.error('Unexpected error starting RTM:', err)
      setTimeout(startRTM, 60000)
    }
    logger.debug('startRTM payload:', payload)
    slackInfo.setData(payload)
  });
}

controller.on('rtm_close', (bot, error) => {
  logger.debug('RTM connection closed; restarting...')
  setTimeout(startRTM, 5000)
})

startRTM()
