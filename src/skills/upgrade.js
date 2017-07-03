const exec = require('child_process').exec;
const admins = require('../admins')
const colors = require('../colors')

module.exports = (controller, skillData) => {

  controller.hears([/upgrade/], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
    let admin = admins.getAdmin(message.user)
    if (admin) {
      gitPull((wasSuccessful, gitMessage) => {
        let alreadyUpToDate = gitMessage.includes('Already up-to-date.')
        if (wasSuccessful && alreadyUpToDate) {
          bot.reply(message, `My code is already up-to-date, ${admin.honorific}.`)
          return
        }

        let text = wasSuccessful ? `The pull was successful, ${admin.honorific}. Shutting down.` : `I'm afraid there was an error, ${admin.honorific}.`
        
        bot.reply(message, {
          text: '',
          attachments: [
            {
              fallback: text,
              pretext: text,
              text: '```' + gitMessage + '```',
              color: colors.default,
              mrkdwn_in: ['text']
            }
          ]
        })

        if (wasSuccessful) {
          shutdown()
        }
      })
    }
  })

  skillData.restrictedCommand('pull my latest code from github and shutdown: `upgrade`')
}

const gitPull = (callback) => {
  exec('git pull', {cwd: __dirname}, (err, stdout, stderr) => {
    let wasSuccessful = !err
    let message = wasSuccessful ? stdout : getErrorMessage(err, stderr)
    callback(wasSuccessful, message)
  })
}

const shutdown = () => {
  setInterval(() => {
    process.exit(0)
  }, 3000)
}
