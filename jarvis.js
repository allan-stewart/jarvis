const Botkit = require('botkit')
const config = require('./config.json')

const controller = Botkit.slackbot({
  send_via_rtm: true
});

controller.hears([/debug/], ['direct_message','direct_mention','mention'], (bot,message) => {
  console.log('Received message:', message)
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

controller.hears([/who am i\?$/i, /who i am\?$/i], ['direct_message','direct_mention','mention'], (bot, message) => {
  getUserInfo(bot, message, message.user)
})

controller.hears([/who <@(.*)> is\?/i, /who is <@(.*)>\s*\?/i], ['direct_message','direct_mention','mention'], function(bot,message) {
  console.log('Received message:', message)
  getUserInfo(bot, message, match[1])
});

let bot = controller.spawn({
  token: config.slackbotToken
});

bot.startRTM(function(err,bot,payload) {
  if (err) {
    console.error('Unexpected error:', err)
  }
  console.log('startRTM payload:', payload)
});
