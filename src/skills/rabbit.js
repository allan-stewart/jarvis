const logger = require('../logger')
const admins = require('../admins')
const rabbit = require('../rabbit')
const slackEncoder = require('../slack-encoder')
const intervalHelper = require('../interval-helper')
const monitoring = require('../rabbit-monitoring-helper')

module.exports = (controller, skillData) => {
  controller.hears([/add rabbit named (.*) at url <(.*)> with username (.*) and password (.*)$/i], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
    let config = {
      name: message.match[1],
      url: message.match[2],
      username: message.match[3],
      password: message.match[4]
    }
    addRabbitEnvironment(bot, message, config)
  })

  controller.hears([/alias rabbit (.*) as (.*)/i], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
    let name = message.match[1]
    let alias = message.match[2]
    addAlias(bot, message, name, alias)
  })

  controller.hears([/list rabbit environments/i], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
    getRabbitConfigs(bot, message)
  })

  controller.hears([/get status of (.*) rabbit queue ([^\s]*) for the last (\d+) minutes/i], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
    let env = message.match[1]
    let queue = slackEncoder.decode(message.match[2])
    let minutes = message.match[3]
    getQueueDetails(bot, message, env, queue, minutes)
  })

  controller.hears([/get status of (.*) rabbit queue ([^\s]*)/i], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
    let env = message.match[1]
    let queue = slackEncoder.decode(message.match[2])
    getQueueDetails(bot, message, env, queue, 10)
  })

  controller.hears([/monitor (.*) rabbit queues matching (.*) for (\d+) minutes/i], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
    let env = message.match[1]
    let pattern = slackEncoder.decode(message.match[2])
    let minutes = message.match[3]
    monitorMatchingQueues(bot, message, env, pattern, minutes, x => x.name.includes(pattern))
  })

  controller.hears([/monitor (.*) rabbit queues ending with (.*) for (\d+) minutes/i], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
    let env = message.match[1]
    let pattern = slackEncoder.decode(message.match[2])
    let minutes = message.match[3]
    monitorMatchingQueues(bot, message, env, pattern, minutes, x => x.name.endsWith(pattern))
  })

  skillData.restrictedCommand('add a rabbit environment: `add rabbit named <name> at url <url> with username <username> and password <password>`')
  skillData.restrictedCommand('add a rabbit alias: `alias rabbit <name> as <alias>`')
  skillData.publicCommand('get known rabbit environments: `list rabbit environments`')
  skillData.publicCommand('get the recent status of a rabbit queue: `get status of <environmentName> rabbit queue <queueName>[ for the last <integer> minutes]`')
  skillData.publicCommand('temporarily monitor rabbit queues: `monitor <environmentName> rabbit queues <matching|ending with> <name> for <integer> minutes`')
}

const addRabbitEnvironment = (bot, message, config) => {
  let admin = admins.getAdmin(message.user)
  if (!admin) {
    bot.reply(message, "I'm afraid you are not allowed to do that.")
    return
  }

  rabbit.addConfig(config)
  bot.reply(message, {
    text: '',
    attachments: [
      {
        pretext: `The Rabbit environment has been added, ${admin.honorific}.`,
        text: '```' + JSON.stringify(rabbit.getConfig(config.name), null, 2) + '```',
        mrkdwn_in: ['text'],
        color: `#add8e6`
      }
    ]
  })
}

const addAlias = (bot, message, name, alias) => {
  let admin = admins.getAdmin(message.user)
  if (!admin) {
    bot.reply(message, "I'm afraid you do not have the permissions to do that.")
    return
  }

  rabbit.addAlias(name, alias)
  bot.reply(message, {
    text: '',
    attachments: [
      {
        pretext: `The Rabbit alias has been added, ${admin.honorific}.`,
        text: '```' + JSON.stringify(rabbit.getConfig(name), null, 2) + '```',
        mrkdwn_in: ['text'],
        color: `#add8e6`
      }
    ]
  })
}

const getRabbitConfigs = (bot, message) => {
  let configs = rabbit.getAllConfigs();
  if (configs.length < 1) {
    bot.reply(message, 'There are no configured rabbit environments.')
    return
  }

  bot.reply(message, {
    text: '',
    attachments: [
      {
        pretext: `Current Rabbit environments:`,
        text: '```' + JSON.stringify(configs, null, 2) + '```',
        mrkdwn_in: ['text'],
        color: `#add8e6`
      }
    ]
  })
}

const getQueueDetails = (bot, message, env, queue, minutes) => {
  rabbit.getQueueDetails(env, queue, minutes, (error, data) => {
    if (error) {
      let was404 = error.message == 'Unexpected status code: 404'
      if (!was404) {
        logger.warn(`Error when getting data for ${env} rabbit queue ${queue}`, error)
      }
      bot.reply(message, `I'm sorry, but I was unable to get data about the ${env} queue: ${queue}`)
      return
    }
    replyQueueDetails(bot, message, data)
  })
}

const replyQueueDetails = (bot, message, data) => {
  let lines = [
    `*${data.name}*`,
    `consumers: ${data.consumers}, messages queued: ${data.messagesQueued}`,
    `in the last ${data.intervalMinutes} minutes there were ${data.messagesPublished} messages published (${data.publishRate.toFixed(2)}/s) and ${data.messagesAcked} acked (${data.ackRate.toFixed(2)}/s)`
  ]

  bot.reply(message, {
    text: '',
    attachments: [
      {
        text: lines.join('\n'),
        mrkdwn_in: ['text'],
        color: `#add8e6`
      }
    ]
  })
}

const monitorMatchingQueues = (bot, message, env, pattern, minutes, filterFunction) => {
  rabbit.getMatchingQueues(env, pattern, (error, data) => {
    if (error) {
      logger.warn(`Error when getting all queues for ${env} rabbit`, error)
      bot.reply(message, `I'm sorry, but I was unable to get the queue data from ${env} rabbit`)
      return
    }

    let filtered = data.filter(filterFunction)
    if (filtered.length < 1) {
      bot.reply(message, `I could not find any queues matching your query.`)
      return
    }
    if (filtered.length > 100) {
      bot.reply(message, `I'm sorry, but I am only allowed to monitor up to 100 queues at a time. Your query specified ${filtered.length}`)
      return
    }

    bot.reply(message, `Now monitoring ${filtered.length} queues`)

    startMonitoringQueues(bot, message, env, minutes, filtered)
  })
}

const startMonitoringQueues = (bot, message, env, minutes, queues) => {
  let aggregateData = monitoring.initAggregateData(queues)
  intervalHelper.until({
    untilMsFromNow: minutes * 60000,
    intervalMs: 60000,
    onInterval: () => queues.forEach(x => monitorQueue(env, x, aggregateData)),
    onEnd: () => replyMonitoringResults(bot, message, aggregateData)
  })
}

const monitorQueue = (env, queue, aggregateData) => {
  rabbit.getQueueDetails(env, queue.name, 1, (error, data) => {
    if (error) {
      monitoring.aggregateError(queue.name, aggregateData)
    } else {
      monitoring.aggregateQueueData(queue.name, data, aggregateData)
    }
  })
}

const replyMonitoringResults = (bot, message, aggregateData) => {
  let summaryData = monitoring.processSummaryData(aggregateData)

  let lines = []
  lines.push(`*Queues:* ${summaryData.totalNumberOfQueues}`)
  lines.push(`*Total messages published:* ${summaryData.messagesPublished}`)
  lines.push(`*Total messages acked:* ${summaryData.messagesAcked}`)
  lines.push(`*Consumer changes:* ${summaryData.consumerChanges}`)
  lines.push(`*# of queues that had no messages:* ${summaryData.totalQueuesThatHadNoMessages}`)
  lines.push(`*# of queues that have messages waiting:* ${summaryData.queuesWithMessagesQueued.length}`)
  lines.push(`*# of queues that lost consumers:* ${summaryData.queuesThatLostConsumers.length}`)
  lines.push(`*Errors querying queues:* ${summaryData.queryErrors}`)

  if (summaryData.queuesWithMessagesQueued.length > 0) {
    lines.push(`*Queues that have messages waiting:*`)
    summaryData.queuesWithMessagesQueued.forEach(x => lines.push(`- ${x} has ${last(aggregateData[x].messagesQueued)} messages`))
  }

  if (summaryData.queuesThatLostConsumers.length > 0) {
    lines.push(`*Queues that lost consumers:*`)
    summaryData.queuesThatLostConsumers.forEach(x => lines.push(`- ${x} has ${last(aggregateData[x].consumers)} consumers`))
  }

  bot.reply(message, {
    text: '',
    attachments: [
      {
        pretext: `I have completed my monitoring.`,
        fallback: `Rabbit data provided via attachment.`,
        text: lines.join('\n'),
        mrkdwn_in: ['text'],
        color: `#add8e6`
      }
    ]
  })
}
