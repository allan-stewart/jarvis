const fileSystem = require('fs')
const admins = require('./admins')
const logger = require('./logger')
const colors = require('./colors')

let commands = []

let skillData = {
  publicCommand: (command) => commands.push({command, restricted: false}),
  restrictedCommand: (command) => commands.push({command, restricted: true})
}

exports.load = (controller) => {
  files = fileSystem.readdirSync(`${__dirname}/skills`)
  files.forEach(x => {
    require(`./skills/${x}`)(controller, skillData)
    logger.info(`Loaded skill: ${x}`)
  })

  controller.hears([/help/i, /what can you do/i], ['direct_message','direct_mention','mention'], (bot, message) => {
    let admin = admins.getAdmin(message.user)
    let showRestricted = !!admin && message.event == 'direct_message'

    let attachments = [buildCommandsAttachment(false)]
    if (showRestricted) {
      attachments.push(buildCommandsAttachment(true))
    }

    bot.reply(message, {
      text: '',
      attachments
    })
  });
}

const buildCommandsAttachment = (restricted) => {
  let text = restricted ? '*Administrator commands:*\n' : ''
  text += commands.filter(x => x.restricted == restricted).map(x => x.command).join('\n')
  return {
    fallback: 'J.A.R.V.I.S. commands...',
    text: text,
    color: restricted ? colors.restricted : colors.default,
    mrkdwn_in: ['text']
  }
}