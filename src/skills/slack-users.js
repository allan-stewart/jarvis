const logger = require('../logger')

module.exports = (controller, skillData) => {

  controller.hears([/who am i\?$/i, /who i am\?$/i], ['direct_message','direct_mention','mention'], (bot, message) => {
    getUserInfo(bot, message, message.user)
  })

  controller.hears([/who <@(.*?)> is\?/i, /who is <@(.*?)>\s*\?*/i], ['direct_message','direct_mention','mention'], (bot, message) => {
    getUserInfo(bot, message, message.match[1])
  });

  skillData.publicCommand('get user information: `who am I?` or `who is <@user>`')

  logger.info('Loaded slack-users skill')
}

const getUserInfo = (bot, message, userId) => {
  bot.api.users.info({user: userId}, (error, userInfo) => {
    let user = userInfo.user
    let profile = user.profile

    let replyInfo = []
    if (profile.email) replyInfo.push(`*Email:* ${profile.email}`)
    if (profile.title) replyInfo.push(`*Title:* ${profile.title}`)
    if (profile.phone) replyInfo.push(`*Phone:* ${profile.phone}`)
    if (profile.status_emoji || profile.status_text) replyInfo.push(`*Status:* ${profile.status_emoji} ${(profile.status_text || '')}`)
    let tz = user.tz ? ` (${user.tz})` : ''
    replyInfo.push(`*Timezone:* ${user.tz_label}${tz}`)
    replyInfo.push(`*Slack Id:* ${user.id}`)
    replyInfo.push(`*Color:* #${user.color}`)
    replyInfo.push(`*Bot:* ${user.is_bot}`)

    bot.reply(message, {
      text: '',
      attachments: [
        {
          pretext: `${user.real_name}`,
          fallback: `${user.real_name}.`,
          text: replyInfo.join('\n'),
          mrkdwn_in: ['text'],
          color: `#${user.color}`
        }
      ]
    })
  })
}
