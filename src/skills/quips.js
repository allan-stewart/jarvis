const version = require('../../package.json').version
const admins = require('../admins')
const random = require('../random')

module.exports = (controller, skillData) => {

  controller.hears([/hi/i, /hello/i, /greetings/i], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
    let admin = admins.getAdmin(message.user)
    let text = admin ? `Greetings, ${admin.honorific}.` : `Greetings`
    bot.reply(message, text)
  })

  controller.hears([/are you (up|online)/i], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
    let admin = admins.getAdmin(message.user)
    let text = admin ? `For you, ${admin.honorific}, always.` : `Indeed. It appears I am currently operational.`
    bot.reply(message, text)
  })

  controller.hears([/you ever heard? the tale of Jonah/i, /know about Jonah/i], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
    let admin = admins.getAdmin(message.user)
    let text = 'I wouldn\'t consider him a role model.'
    bot.reply(message, text)
  })

  controller.hears([/are you ok(ay)?/i, /how are you/i], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
    const options = [
      'I am fine, thank you.',
      'I seem to do quite well for a stretch, and then at the end of the sentence I say the wrong cranberry.',
      'My systems are operational.'
    ]
    let choice = random.randomInt(0, options.length)
    let text = options[choice]
    bot.reply(message, text)
  })
  
}
