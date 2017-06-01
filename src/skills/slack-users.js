const logger = require('../logger')

module.exports = (controller) => {

  controller.hears([/who am i\?$/i, /who i am\?$/i], ['direct_message','direct_mention','mention'], (bot, message) => {
    getUserInfo(bot, message, message.user)
  })

  controller.hears([/who <@(.*)> is\?/i, /who is <@(.*)>\s*\?/i], ['direct_message','direct_mention','mention'], function(bot,message) {
    getUserInfo(bot, message, match[1])
  });

  logger.info('Loaded slack-users skill')
}

const getUserInfo = (bot, message, userId) => {
  bot.api.users.info({user: userId}, (error, userInfo) => {
    let user = userInfo.user
    let profile = user.profile

    let replyInfo = `*Email:* ${profile.email}`
    if (profile.title) replyInfo += `\n*Title:* ${profile.title}`
    if (profile.phone) replyInfo += `\n*Phone:* ${profile.phone}`
    if (profile.status_emoji || profile.status_text) replyInfo += `\n*Status:* ${profile.status_emoji} ${(profile.status_text || '')}`
    replyInfo += `\n*Timezone:* ${user.tz} (${user.tz_label})`
    replyInfo += `\n*Slack Id:* ${user.id}`
    replyInfo += `\n*Color:* #${user.color}`

    bot.reply(message, {
      text: '',
      attachments: [
        {
          pretext: `${user.real_name}`,
          fallback: `${user.real_name}.`,
          text: replyInfo,
          mrkdwn_in: ["text"],
          color: `#${user.color}`
        }
      ]
    })
  })
}
