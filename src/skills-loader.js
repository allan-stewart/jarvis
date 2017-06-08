const fileSystem = require('fs')
const admins = require('./admins')
const logger = require('./logger')

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
    let filtered = showRestricted ? commands : commands.filter(x => !x.restricted)
    let text = filtered.map(x => x.command).join('\n')

    bot.reply(message, {
      text: '',
      attachments: [
        {
          fallback: 'J.A.R.V.I.S. help commands...',
          text: text,
          color: '#add8e6',
          mrkdwn_in: ['text']
        }
      ]
    })
  });
}
