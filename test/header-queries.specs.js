const headerQueries = require('../src/header-queries')
const assert = require('assert')

require('../src/logger').disable()

describe('header-queries', () => {
  let savedData
  const initialData = [{name: 'a query', headers: ['h1','h2'], url: 'http://example.com'}]

  beforeEach(() => {
    loadController(null, initialData.concat())
    savedData = null
  })

  let loadController = (error, data) => {
    const controller = { storage : { teams: {
      get: (id, callback) => {
        callback(error, {queries: data})
      },
      save: (data) => { savedData = data }
    }}}
    headerQueries.load(controller)
  }

  describe('load', () => {
    it('should have zero configs if loading fails', () => {
      loadController(new Error('Test error'), null)
      assert.equal(headerQueries.getAll().length, 0)
    })

    it('should have the initial data if loading succeeds', () => {
      assert.deepEqual(headerQueries.getAll(), initialData)
    })
  })

  describe('any', () => {
    it('should return true if there are some loaded queries', () => {
      assert.equal(headerQueries.any(), true)
    })

    it('should return false if there are no loaded queries', () => {
      loadController(null, [])
      assert.equal(headerQueries.any(), false)
    })
  })

  describe('getAll', () => {
    it('should return all the queries', () => {
      assert.deepEqual(headerQueries.getAll(), initialData)
    })
  })

  describe('getQuery', () => {
    it('should return the query if it matches the name', () => {
      assert.deepEqual(headerQueries.get('a query'), initialData[0])
    })

    it('should return null if there is no match', () => {
      assert.equal(headerQueries.get('fake'), null)
    })
  })

  describe('addQuery', () => {
    const newName = 'new query'
    const newHeaders = ['version']
    const newUrl = 'http://example.com/healthcheck'
    
    beforeEach(() => {
      headerQueries.add(newName, newHeaders, newUrl)
    })

    it('should add the query', () => {
      assert.deepEqual(headerQueries.get(newName), {name: newName, headers: newHeaders, url: newUrl})
    })

    it('should have one more query than the initial load', () => {
      assert.equal(initialData.length, 1)
      assert.equal(headerQueries.getAll().length, initialData.length + 1)
    })
  })

  describe('processResultHeaders', () => {
    it('should return an array with the matching headers', () => {
      const queryHeaders = ['version', 'server'];
      const apiHeaders = {'a': 'b', 'version': '123', 'server': 'node-1', 'x': 'y'}
      const result = headerQueries.testing.processResultHeaders(queryHeaders, apiHeaders)
      const expected = 'version: 123, server: node-1'
      assert.deepEqual(result, expected)
    })

    it('should match headers case insensitively', () => {
      const queryHeaders = ['Version', 'SERVER'];
      const apiHeaders = {'a': 'b', 'version': '123', 'server': 'node-1', 'x': 'y'}
      const result = headerQueries.testing.processResultHeaders(queryHeaders, apiHeaders)
      const expected = 'version: 123, server: node-1'
      assert.deepEqual(result, expected)
    })

    it('should fill headers with undefined if the api did not return them', () => {
      const queryHeaders = ['Version', 'SERVER'];
      const apiHeaders = {'a': 'b', 'server': 'node-1', 'x': 'y'}
      const result = headerQueries.testing.processResultHeaders(queryHeaders, apiHeaders)
      const expected = 'version: undefined, server: node-1'
      assert.deepEqual(result, expected)
    })
  })

  describe('processResults', () => {
    it('should return a summary of the results', () => {
      const results = [
        {error: null, status: 200, headers: 'version: 123, server: node-1'},
        {error: null, status: 200, headers: 'version: 123, server: node-2'},
        {error: new Error('Oh noes'), status: null, headers: null},
        {error: null, status: 200, headers: 'version: 123, server: node-2'},
        {error: null, status: 404, headers: 'version: 123, server: node-1'},
        {error: null, status: 200, headers: 'version: 999, server: node-1'}
      ]
      const summary = headerQueries.testing.processResults(results)
      const expected = {errors: 1, statusCodes: [
        {statusCode: 200, headers: [
          {value: 'version: 123, server: node-1', count: 1},
          {value: 'version: 123, server: node-2', count: 2},
          {value: 'version: 999, server: node-1', count: 1},
        ]},
        {statusCode: 404, headers: [
          {value: 'version: 123, server: node-1', count: 1}
        ]}
      ]}
      assert.deepEqual(summary, expected)
    })
  })
})