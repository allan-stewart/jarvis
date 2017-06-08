const monitoring = require('../src/rabbit-monitoring-helper')
const assert = require('assert')

describe('rabbit-monitoring-helper', () => {
  describe('initAggregateData', () => {
    it('should set up the initial data for each queue', () => {
      let result = monitoring.initAggregateData(initialQueuesData)
      assert.deepEqual(result, {
        'queue-a': {consumers: [2], messagesAcked: 0, messagesPublished: 0, messagesQueued: [1], queryErrors: 0},
        'queue-b': {consumers: [4], messagesAcked: 0, messagesPublished: 0, messagesQueued: [3], queryErrors: 0},
        'queue-c': {consumers: [0], messagesAcked: 0, messagesPublished: 0, messagesQueued: [1], queryErrors: 0}
      })
    })
  })

  describe('aggregateError', () => {
    it('increment an error for the queue', () => {
      let data = monitoring.initAggregateData(initialQueuesData)
      monitoring.aggregateError('queue-b', data)
      assert.deepEqual(data, {
        'queue-a': {consumers: [2], messagesAcked: 0, messagesPublished: 0, messagesQueued: [1], queryErrors: 0},
        'queue-b': {consumers: [4], messagesAcked: 0, messagesPublished: 0, messagesQueued: [3], queryErrors: 1},
        'queue-c': {consumers: [0], messagesAcked: 0, messagesPublished: 0, messagesQueued: [1], queryErrors: 0}
      })
    })
  })

  describe('aggregateQueueData', () => {
    it('should add the new queue data to the queue aggregate', () => {
      let data = monitoring.initAggregateData(initialQueuesData)
      monitoring.aggregateQueueData('queue-a', queueAData, data)
      monitoring.aggregateQueueData('queue-b', queueBData, data)
      assert.deepEqual(data, {
        'queue-a': {consumers: [2, 0], messagesAcked: 6, messagesPublished: 7, messagesQueued: [1, 1], queryErrors: 0},
        'queue-b': {consumers: [4], messagesAcked: 11, messagesPublished: 10, messagesQueued: [3, 0], queryErrors: 0},
        'queue-c': {consumers: [0], messagesAcked: 0, messagesPublished: 0, messagesQueued: [1], queryErrors: 0}
      })

      monitoring.aggregateQueueData('queue-a', queueAData, data)
      assert.deepEqual(data, {
        'queue-a': {consumers: [2, 0], messagesAcked: 12, messagesPublished: 14, messagesQueued: [1, 1, 1], queryErrors: 0},
        'queue-b': {consumers: [4], messagesAcked: 11, messagesPublished: 10, messagesQueued: [3, 0], queryErrors: 0},
        'queue-c': {consumers: [0], messagesAcked: 0, messagesPublished: 0, messagesQueued: [1], queryErrors: 0}
      })
    })
  })

  describe('processSummaryData', () => {
    it('should create a summary of the aggregateData', () => {
      let data = monitoring.initAggregateData(initialQueuesData)
      monitoring.aggregateQueueData('queue-a', queueAData, data)
      monitoring.aggregateQueueData('queue-b', queueBData, data)
      monitoring.aggregateError('queue-a', data)

      let result = monitoring.processSummaryData(data)
      assert.deepEqual(result, {
        totalNumberOfQueues: 3,
        messagesPublished: 17,
        messagesAcked: 17,
        consumerChanges: 1,
        queryErrors: 1,
        totalQueuesThatHadNoMessages: 1,
        queuesWithMessagesQueued: ['queue-a', 'queue-c'],
        queuesThatLostConsumers: ['queue-a']
      })
    })
  })
})

const initialQueuesData = [
  {name: 'queue-a', messagesQueued: 1, consumers: 2},
  {name: 'queue-b', messagesQueued: 3, consumers: 4},
  {name: 'queue-c', messagesQueued: 1, consumers: 0}
]

const queueAData = { messagesQueued: 1, consumers: 0, messagesPublished: 7, messagesAcked: 6 }
const queueBData = { messagesQueued: 0, consumers: 4, messagesPublished: 10, messagesAcked: 11 }
const queueCData = { messagesQueued: 1, consumers: 0, messagesPublished: 0, messagesAcked: 0 }
