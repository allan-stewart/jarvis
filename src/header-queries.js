const logger = require('./logger')
const request = require('request')

const storageId = 'header-queries'

let queries = []
let storage = null

exports.load = (controller) => {
  storage = controller.storage.teams
  storage.get(storageId, (error, data) => {
    if (error) {
      logger.error('Unable to load header queries', error)
      queries = []
      return
    }
    queries = data.queries
    logger.info(`Loaded ${queries.length} header queries`)
  })
}

exports.any = () => {
  return queries.length > 0
}

exports.getAll = () => {
  return queries
}

exports.get = (name) => {
  return queries.find(x => x.name == name)
}

exports.add = (name, headers, url) => {
  queries.push({name, headers, url})
  storage.save({id: storageId, queries})
}

exports.execute = (name, callback) => {
  var query = exports.get(name)
  if (!query) {
    callback(new Error(`Unable to find query: ${name}`))
    return
  }
  var results = []
  callApi(query, [], 10, callback)
}

const callApi = (query, results, callsRemaining, callback) => {
  if (callsRemaining <= 0) {
    callback(null, processResults(results))
    return
  }

  request(query.url, (error, response, body) => {
    let status = error ? null : response.statusCode
    let headers = error ? null : processResultHeaders(query.headers, response.headers)
    if (error) {
      console.log(error)
    }
    results.push({error, status, headers})
    callApi(query, results, callsRemaining - 1, callback)
  })
}

const processResults = (results) => {
  let result = {errors: 0, statusCodes: []}
  results.forEach(x => {
    if (x.error) {
      result.errors++
    } else {
      var status = findOrInitialize(result.statusCodes, 'statusCode', x.status, {statusCode: x.status, headers: []})
      var header = findOrInitialize(status.headers, 'value', x.headers, {value: x.headers, count: 0})
      header.count++
    }
  })
  return result
}

const findOrInitialize = (array, key, match, initValue) => {
  if (!array.find(x => x[key] == match)) {
    array.push(initValue)
  }
  return array.find(x => x[key] == match)
}

const getKeyOrInitialize = (obj, key, initValue) => {
  if (!obj[key]) {
    obj[key] = initValue
  }
  return obj[key]
}

const processResultHeaders = (queryHeaders, apiHeaders) => {
  return queryHeaders.map(x => x.toLowerCase()).map(x => {
    return `${x}: ${apiHeaders[x]}`
  }).join(', ')
}

exports.testing = {
  processResultHeaders,
  processResults
}