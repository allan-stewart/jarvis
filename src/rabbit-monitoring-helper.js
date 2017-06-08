exports.initAggregateData = (queues) => {
  let aggregateData = {}
  queues.forEach(x => {
    aggregateData[x.name] = {
      messagesQueued: [x.messagesQueued],
      messagesPublished: 0,
      messagesAcked: 0,
      consumers: [x.consumers],
      queryErrors: 0
    }
  })
  return aggregateData
}

exports.aggregateError = (queueName, aggregateData) => {
  let queueData = aggregateData[queueName]
  queueData.queryErrors++
}

exports.aggregateQueueData = (queueName, data, aggregateData) => {
  let queueData = aggregateData[queueName]
  queueData.messagesQueued.push(data.messagesQueued)
  queueData.messagesPublished += data.messagesPublished
  queueData.messagesAcked += data.messagesAcked
  let lastConsumersValue = queueData.consumers[queueData.consumers.length - 1]
  if (data.consumers != lastConsumersValue) {
    queueData.consumers.push(data.consumers)
  }
}

exports.processSummaryData = aggregateData => {
  let keys = Object.keys(aggregateData)
  let summaryData = {
    totalNumberOfQueues: keys.length,
    messagesPublished: 0,
    messagesAcked: 0,
    consumerChanges: 0,
    queryErrors: 0,
    totalQueuesThatHadNoMessages: 0,
    queuesWithMessagesQueued: [],
    queuesThatLostConsumers: []
  }

  keys.forEach(queue => {
    let queueData = aggregateData[queue]
    summaryData.messagesPublished += queueData.messagesPublished
    summaryData.messagesAcked += queueData.messagesAcked
    summaryData.consumerChanges += (queueData.consumers.length - 1)
    summaryData.queryErrors += queueData.queryErrors
    if (queueData.messagesPublished + queueData.messagesAcked < 1) {
      summaryData.totalQueuesThatHadNoMessages++
    }
    let avgMessagesQueued = sum(queueData.messagesQueued) / queueData.messagesQueued.length
    if (avgMessagesQueued > .5 && last(queueData.messagesQueued) > 0) {
      summaryData.queuesWithMessagesQueued.push(queue)
    }
    if (queueData.consumers.length > 1 && last(queueData.consumers) < first(queueData.consumers)) {
      summaryData.queuesThatLostConsumers.push(queue)
    }
  })

  return summaryData
}

const sum = array => array.reduce((a, b) => a + b)
const first = array => array[0]
const last = array => array[array.length - 1]
