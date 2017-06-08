const logger = require('../logger')
const admins = require('../admins')

module.exports = (controller, skillData) => {
  controller.hears([/make <@(.*?)> an admin with the honorific (sir|maam)$/], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
    let admin = admins.getAdmin(message.user)
    let check = admins.getAdmin(message.match[1])

    if (!admins.any() || admin) {
      if (check) {
        bot.reply(message, `That user is already an admin, ${admin.honorific}.`)
      } else {
        admins.addAdmin(message.match[1], message.match[2])
        bot.reply(message, admin ? `Done, ${admin.honorific}.` : 'Admin privilages granted.')
      }
    } else {
      bot.reply(message, "I'm afraid you do not have the privilages to do that.")
    }
  })

  controller.hears([/list admins/], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
    let admin = admins.getAdmin(message.user)
    if (admin) {
      let allAdmins = admins.getAll()
      bot.reply(message, {
        text: '',
        attachments: [
          {
            text: allAdmins.map(x => `<@${x.userId}> (${x.honorific})`).join('\n'),
            mrkdwn_in: ['text'],
            color: `#add8e6`
          }
        ]
      })
    } else {
      bot.reply(message, "I'm afraid you do not have the privilages to do that.")
    }
  })

  skillData.restrictedCommand('grant admin privilages: `make <@user> an admin with the honorific <sir|maam>`')
  skillData.restrictedCommand('list admins: `list admins`')

  logger.info('Loaded admin skill')
}
