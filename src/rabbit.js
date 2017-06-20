const request = require('request')
const logger = require('./logger')
const storageId = 'rabbit'

let rabbitConfigs = []
let storage = null

exports.load = (controller) => {
  storage = controller.storage.teams
  storage.get(storageId, (error, data) => {
    if (error) {
      rabbitConfigs = []
      logger.error('Unable to load rabbit configurations', error)
      return
    }
    rabbitConfigs = data.configs
    logger.info(`Loaded ${rabbitConfigs.length} rabbit configurations`)
  })
}

const saveConfigs = () => {
  storage.save({id: storageId, configs: rabbitConfigs})
}

exports.addConfig = (config) => {
  if (getConfig(config.name)) {
    rabbitConfigs = rabbitConfigs.filter(x => x.name != config.name && !x.aliases.includes(config.name))
  }
  rabbitConfigs.push({
    name: config.name,
    aliases: config.aliases || [],
    url: config.url,
    username: config.username,
    password: config.password
  })
  saveConfigs()
}

const getConfig = (envNameOrAlias) => {
  return rabbitConfigs.find(x => x.name == envNameOrAlias || x.aliases.includes(envNameOrAlias))
}

const getConfigOrThrow = envNameOrAlias => {
  let config = getConfig(envNameOrAlias)
  if (!config) {
    throw new Error(`Unable to find rabbit configuration called ${envNameOrAlias}`)
  }
  return config
}

exports.addAlias = (envNameOrAlias, alias) => {
  let config = getConfigOrThrow(envNameOrAlias)
  config.aliases.push(alias)
  saveConfigs()
}

const safeConfig = (config) => {
  return {name: config.name, aliases: config.aliases, url: config.url, username: config.username}
}

exports.getConfig = (envNameOrAlias) => {
  return safeConfig(getConfigOrThrow(envNameOrAlias))
}

exports.getAllConfigs = () => {
  return rabbitConfigs.map(x => safeConfig(x))
}

const buildRequest = (config, path) => {
  return {
    url: `${config.url}${path}`,
    auth: {
      user: config.username,
      pass: config.password
    },
    json: true
  }
}

const makeRequest = (requestData, callback) => {
  request(requestData, (error, response, body) => {
    if (error) {
      callback(error)
      return
    }
    if (response.statusCode != 200) {
      callback(new Error(`Unexpected status code: ${response.statusCode}`))
      return
    }
    callback(null, body)
  })
}

exports.getExchangeDetails = (envNameOrAlias, exchangeName, minutes, callback) => {
  let config = getConfigOrThrow(envNameOrAlias)
  let age = Math.floor(minutes * 60)
  let incr = Math.floor(age / 2)
  makeRequest(buildRequest(config, `/exchanges/%2F/${exchangeName}?msg_rates_age=${age}&msg_rates_incr=${incr}`), (error, data) => {
    if (error) {
      callback(error)
      return
    }
    callback(null, exports.processExchangeData(data, minutes))
  })
}

exports.getAllQueues = (envNameOrAlias, callback) => {
  let config = getConfigOrThrow(envNameOrAlias)
  makeRequest(buildRequest(config, `/queues/%2F?columns=name`), callback)
}

exports.getMatchingQueues = (envNameOrAlias, match, callback) => {
  let config = getConfigOrThrow(envNameOrAlias)
  makeRequest(buildRequest(config, `/queues?page=1&name=${match}`), (error, data) => {
    if (error) {
      callback(error)
      return
    }
    callback(null, data.items.map(x => exports.processQueueData(x, 0)))
  })
}

exports.getQueueDetails = (envNameOrAlias, queueName, minutes, callback) => {
  let config = getConfigOrThrow(envNameOrAlias)
  let age = Math.floor(minutes * 60)
  let incr = Math.floor(age / 2)
  makeRequest(buildRequest(config, `/queues/%2F/${queueName}?msg_rates_age=${age}&msg_rates_incr=${incr}&columns=name,consumers,messages,message_stats`), (error, data) => {
    if (error) {
      callback(error)
      return
    }
    callback(null, exports.processQueueData(data, minutes))
  })
}

exports.processExchangeData = (data, minutes) => {
  let stats = data.message_stats

  return {
    name: data.name,
    publishRate: stats ? stats.publish_in_details.avg_rate : 0,
    messagesPublished: processSamples(stats ? stats.publish_in_details.samples : []),
    intervalMinutes: minutes
  }
}

exports.processQueueData = (data, minutes) => {
  let stats = data.message_stats

  return {
    name: data.name,
    consumers: data.consumers,
    messagesQueued: data.messages,
    publishRate: stats ? stats.publish_details.avg_rate : 0,
    ackRate: stats ? stats.ack_details.avg_rate : 0,
    messagesPublished: processSamples(stats ? stats.publish_details.samples : []),
    messagesAcked: processSamples(stats ? stats.ack_details.samples : []),
    intervalMinutes: minutes
  }
}

const processSamples = samples => {
  if (!samples || samples.length < 1) {
    return 0
  }
  let min = Math.min(...samples.map(x => x.sample))
  let max = Math.max(...samples.map(x => x.sample))
  return max - min
}
