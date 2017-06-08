const rabbit = require('../src/rabbit')
const assert = require('assert')

require('../src/logger').disable()

describe('rabbit', () => {
  describe('configuration', () => {
    let savedData = null

    beforeEach(() => {
      let controller = { storage: { teams: {
        get: (id, callback) => {
          callback(null, {configs: [
            {name: 'production', url: 'prod-url', username: 'prod-test', password: 'prod-pass', aliases: ['prod']},
            {name: 'stage', url: 'stage-url', username: 'stage-test', password: 'stage-pass', aliases: []}
          ]})
        },
        save: (save) => { savedData = save }
      } } }
      rabbit.load(controller)
    })

    describe('load', () => {
      it('should have zero configs if loading fails', () => {
        let controller = { storage: { teams: { get: (id, callback) => { callback(new Error('test error')) } } } }
        rabbit.load(controller)
        assert.equal(rabbit.getAllConfigs().length, 0)
      })

      it('should have configs if loading succeeds', () => {
        assert.equal(rabbit.getAllConfigs().length, 2)
      })
    })

    describe('addConfig', () => {
      it('should add a new config without empty aliases if not provided', () => {
        rabbit.addConfig({name: 'dev', url: 'dev-url', username: 'dev-test', password: 'dev-pass'})
        let expected = {name: 'dev', url: 'dev-url', username: 'dev-test', aliases: []}
        assert.deepEqual(rabbit.getConfig('dev'), expected)
      })

      it('should add a new config with aliases if provided', () => {
        rabbit.addConfig({name: 'dev', url: 'dev-url', username: 'dev-test', password: 'dev-pass', aliases: ['d']})
        let expected = {name: 'dev', url: 'dev-url', username: 'dev-test', aliases: ['d']}
        assert.deepEqual(rabbit.getConfig('dev'), expected)
      })

      it('should save the configs', () => {
        rabbit.addConfig({name: 'dev', url: 'dev-url', username: 'dev-test', password: 'dev-pass'})
        assert.deepEqual(savedData, {
          id: 'rabbit',
          configs: [
            {name: 'production', url: 'prod-url', username: 'prod-test', password: 'prod-pass', aliases: ['prod']},
            {name: 'stage', url: 'stage-url', username: 'stage-test', password: 'stage-pass', aliases: []},
            {name: 'dev', url: 'dev-url', username: 'dev-test', password: 'dev-pass', aliases: []}
          ]
        })
      })

      it('should overwrite an existing config by that name', () => {
        rabbit.addConfig({name: 'production', url: 'new-url', username: 'new-prod', password: 'new-pass', aliases: ['new-prod']})
        assert.equal(rabbit.getAllConfigs().length, 2)
        assert.deepEqual(rabbit.getConfig('production'), {name: 'production', url: 'new-url', username: 'new-prod', aliases: ['new-prod']})
      })

      it('should overwrite an existing config by that alias', () => {
        rabbit.addConfig({name: 'prod', url: 'new-url', username: 'new-prod', password: 'new-pass', aliases: ['new-prod']})
        assert.equal(rabbit.getAllConfigs().length, 2)
        assert.deepEqual(rabbit.getConfig('prod'), {name: 'prod', url: 'new-url', username: 'new-prod', aliases: ['new-prod']})
      })
    })

    describe('getConfig', () => {
      it('should get a config by name', () => {
        let expected = {name: 'stage', url: 'stage-url', username: 'stage-test', aliases: []}
        assert.deepEqual(rabbit.getConfig('stage'), expected)
      })

      it('should get a config by alias', () => {
        let expected = {name: 'production', url: 'prod-url', username: 'prod-test', aliases: ['prod']}
        assert.deepEqual(rabbit.getConfig('prod'), expected)
      })
    })

    describe('getAllConfigs', () => {
      it('should return all configs with passwords stripped out', () => {
        let expected = [
          {name: 'production', url: 'prod-url', username: 'prod-test', aliases: ['prod']},
          {name: 'stage', url: 'stage-url', username: 'stage-test', aliases: []}
        ]
        assert.deepEqual(rabbit.getAllConfigs(), expected)
      })
    })
  })

  describe('data processing', () => {
    describe('processQueueData', () => {
      it('should return the data we care about', () => {
        let input = exampleQueueData
        let minutes = 10
        let publishSamples = exampleQueueData.message_stats.publish_details.samples
        let ackSamples = exampleQueueData.message_stats.ack_details.samples
        let expected = {
          name: exampleQueueData.name,
          consumers: exampleQueueData.consumers,
          messagesQueued: exampleQueueData.messages,
          publishRate: exampleQueueData.message_stats.publish_details.avg_rate,
          ackRate: exampleQueueData.message_stats.ack_details.avg_rate,
          messagesPublished: publishSamples[0].sample - publishSamples[2].sample,
          messagesAcked: ackSamples[0].sample - ackSamples[2].sample,
          intervalMinutes: minutes
        }
        assert.deepEqual(rabbit.processQueueData(input, minutes), expected)
      })

      it('should not fail if there are no message_stats', () => {
        let input = exampleQueueDataWithoutMessageStats
        let minutes = 2
        let expected = {
          name: exampleQueueDataWithoutMessageStats.name,
          consumers: exampleQueueDataWithoutMessageStats.consumers,
          messagesQueued: exampleQueueDataWithoutMessageStats.messages,
          publishRate: 0,
          ackRate: 0,
          messagesPublished: 0,
          messagesAcked: 0,
          intervalMinutes: minutes
        }
        assert.deepEqual(rabbit.processQueueData(input, minutes), expected)
      })
    })
  })
})

const exampleQueueData = {
  "name":"ps.monolith.useraccountupdated.v2=>ps.identity.listener",
  "consumers":2,
  "messages":0,
  "message_stats": {
    "disk_reads":0,
    "disk_reads_details":{"rate":0.0,"samples":[{"sample":0,"timestamp":1496865300000},{"sample":0,"timestamp":1496865000000},{"sample":0,"timestamp":1496864700000}],"avg_rate":0.0,"avg":0.0},
    "disk_writes":9726395,
    "disk_writes_details":{"rate":1.4,"samples":[{"sample":9726395,"timestamp":1496865300000},{"sample":9725968,"timestamp":1496865000000},{"sample":9725486,"timestamp":1496864700000}],"avg_rate":1.515,"avg":9725949.666666666},
    "deliver":9666364,
    "deliver_details":{"rate":0.8,"samples":[{"sample":9666364,"timestamp":1496865300000},{"sample":9665935,"timestamp":1496865000000},{"sample":9665526,"timestamp":1496864700000}],"avg_rate":1.3966666666666667,"avg":9665941.666666666},
    "deliver_no_ack":0,
    "deliver_no_ack_details":{"rate":0.0,"samples":[{"sample":0,"timestamp":1496865300000},{"sample":0,"timestamp":1496865000000},{"sample":0,"timestamp":1496864700000}],"avg_rate":0.0,"avg":0.0},
    "get":0,
    "get_details":{"rate":0.0,"samples":[{"sample":0,"timestamp":1496865300000},{"sample":0,"timestamp":1496865000000},{"sample":0,"timestamp":1496864700000}],"avg_rate":0.0,"avg":0.0},
    "get_no_ack":0,
    "get_no_ack_details":{"rate":0.0,"samples":[{"sample":0,"timestamp":1496865300000},{"sample":0,"timestamp":1496865000000},{"sample":0,"timestamp":1496864700000}],"avg_rate":0.0,"avg":0.0},
    "publish":9721145,
    "publish_details":{"rate":1.8,"samples":[{"sample":9721145,"timestamp":1496865300000},{"sample":9720718,"timestamp":1496865000000},{"sample":9720312,"timestamp":1496864700000}],"avg_rate":1.3883333333333334,"avg":9720725.0},
    "publish_in":0,
    "publish_in_details":{"rate":0.0,"samples":[{"sample":0,"timestamp":1496865300000},{"sample":0,"timestamp":1496865000000},{"sample":0,"timestamp":1496864700000}],"avg_rate":0.0,"avg":0.0},
    "publish_out":0,
    "publish_out_details":{"rate":0.0,"samples":[{"sample":0,"timestamp":1496865300000},{"sample":0,"timestamp":1496865000000},{"sample":0,"timestamp":1496864700000}],"avg_rate":0.0,"avg":0.0},
    "ack":9665503,
    "ack_details":{"rate":0.8,"samples":[{"sample":9665503,"timestamp":1496865300000},{"sample":9665074,"timestamp":1496865000000},{"sample":9664665,"timestamp":1496864700000}],"avg_rate":1.3966666666666667,"avg":9665080.666666666},
    "deliver_get":9666364,
    "deliver_get_details":{"rate":0.8,"samples":[{"sample":9666364,"timestamp":1496865300000},{"sample":9665935,"timestamp":1496865000000},{"sample":9665526,"timestamp":1496864700000}],"avg_rate":1.3966666666666667,"avg":9665941.666666666},
    "confirm":0,
    "confirm_details":{"rate":0.0,"samples":[{"sample":0,"timestamp":1496865300000},{"sample":0,"timestamp":1496865000000},{"sample":0,"timestamp":1496864700000}],"avg_rate":0.0,"avg":0.0},
    "return_unroutable":0,
    "return_unroutable_details":{"rate":0.0,"samples":[{"sample":0,"timestamp":1496865300000},{"sample":0,"timestamp":1496865000000},{"sample":0,"timestamp":1496864700000}],"avg_rate":0.0,"avg":0.0},
    "redeliver":861,
    "redeliver_details":{"rate":0.0,"samples":[{"sample":861,"timestamp":1496865300000},{"sample":861,"timestamp":1496865000000},{"sample":861,"timestamp":1496864700000}],"avg_rate":0.0,"avg":861.0}
  }
}

const exampleQueueDataWithoutMessageStats = {
  "memory": 143024,
  "messages": 173,
  "messages_ready": 173,
  "consumers": 0,
  "idle_since": "2017-05-19 19:30:45",
  "state": "running",
  "node": "rabbit@ISD-RABBIT-CWA-2",
  "arguments": {},
  "exclusive": false,
  "auto_delete": false,
  "durable": true,
  "vhost": "/",
  "name": "EasyNetQ_Default_Error_Queue"
}
