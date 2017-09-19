const headerQueries = require('../header-queries')
const admins = require('../admins')
const colors = require('../colors')
const slackEncoder = require('../slack-encoder')

module.exports = (controller, skillData) => {
  controller.hears([/register headers query "(.*?)": headers: (.*?), url: (.*?)$/i], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
    let query = message.match[1]
    let headers = message.match[2].split(',').map(x => x.trim())
    let url = message.match[3].replace('<', '').replace('>', '')
    register(bot, message, query, headers, url)
  })

  controller.hears([/remove headers query "(.*?)"$/i], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
    let query = message.match[1]
    remove(bot, message, query)
  })

  controller.hears([/list header queries/i], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
    list(bot, message)
  })

  controller.hears(/get headers for (.*?)$/i, ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
    let query = message.match[1]
    execute(bot, message, query)
  })

  skillData.restrictedCommand('register headers query: `register headers query "<name>": headers: <comma-delimited-list>, url: <url>`')
  skillData.restrictedCommand('remove headers query: `remove headers query "<name>"')
  skillData.publicCommand('list available header queries: `list header queries`')
  skillData.publicCommand('execute headers query: `get headers for <queryName>`')
}

const register = (bot, message, query, headers, url) => {
  let admin = admins.getAdmin(message.user)
  if (admin) {
    headerQueries.add(query, headers, url)
    bot.reply(message, `The query for ${query} has been added, ${admin.honorific}.`)
  } else {
    bot.reply("I'm afraid you do not have the privilages to do that.")
  }
}

const remove = (bot, message, query) => {
  let admin = admins.getAdmin(message.user)
  if (admin) {
    headerQueries.remove(query)
    bot.reply(message, `The query for ${query} has been removed, ${admin.honorific}.`)
  } else {
    bot.reply("I'm sorry, but I cannot allow you to do that.")
  }
}

const list = (bot, message) => {
  if (!headerQueries.any()) {
    bot.reply(message, 'There are no registered header queries.')
    return
  }
  
  let queries = headerQueries.getAll()
  let text = queries.map(x => `${x.name} ( [${x.headers.join(', ')}] from ${x.url} )`).join('\n')
  
  bot.reply(message, {
    text: '',
    attachments: [
      {
        pretext: `Registered header queries:`,
        text,
        mrkdwn_in: ['text'],
        color: colors.default
      }
    ]
  })
}

const execute = (bot, message, query) => {
  headerQueries.execute(query, (error, results) => {
    if (error) {
      bot.reply(message, error.message)
      return
    }

    let text = results.statusCodes.map(x => {
      return `Status ${x.statusCode}:\n` + x.headers.map(y => `    ${y.value} (${y.count})`).join('\n')
    }).join('\n') + `\nErrors: ${results.errors}`

    bot.reply(message, {
      text: '',
      attachments: [
        {
          pretext: `Header query result for ${query}:`,
          text,
          mrkdwn_in: ['text'],
          color: colors.default
        }
      ]
    })
  })
}