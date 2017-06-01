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

const getUserInfo = (bot, message, user) => {
  bot.api.users.info({user}, (error, userInfo) => {
    let profile = userInfo.user.profile

    let replyInfo = `Email: ${profile.email}`
    if (profile.title) replyInfo += `\nTitle: ${profile.title}`
    if (profile.phone) replyInfo += `\nPhone: ${profile.phone}`
    if (profile.status_emoji || profile.status_text) replyInfo += `\nStatus: ${profile.status_emoji} ${(profile.status_text || '')}`
    replyInfo += `\nTimezone: ${userInfo.user.tz} (${userInfo.user.tz_label})`
    replyInfo += `Color: #${userInfo.user.color}`

    bot.reply(message, {
      text: '',
      attachments: [
        {
          pretext: `${userInfo.user.real_name}`,
          fallback: `${userInfo.user.real_name}.`,
          text: replyInfo,
          mrkdwn_in: ["text"],
          color: `#${userInfo.user.color}`
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
