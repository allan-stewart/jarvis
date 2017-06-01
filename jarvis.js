const Botkit = require('botkit')
const config = require('./config.json')
const version = require('./package.json').version
const logger = require('./src/logger')
const skillsLoader = require('./src/skills-loader')

logger.setLogLevel(config.logLevel)

logger.info(`Initializing J.A.R.V.I.S. version ${version}`)

const controller = Botkit.slackbot({
  send_via_rtm: true
})

skillsLoader.load(controller)

let bot = controller.spawn({
  token: config.slackbotToken
});

bot.startRTM((error, bot, payload) => {
  if (error) {
    logger.error('Unexpected error:', err)
  }
  logger.debug('startRTM payload:', payload)
});
