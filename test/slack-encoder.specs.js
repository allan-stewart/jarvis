const encoder = require('../src/slack-encoder')
const assert = require('assert')

describe('slack-encoder', () => {
  describe('encode', () => {
    it('should encode all the special characters', () => {
      let input = 'This is a <test> & <another test> & <a third>'
      let expected = 'This is a &lt;test&gt; &amp; &lt;another test&gt; &amp; &lt;a third&gt;'
      assert.equal(encoder.encode(input), expected)
    })
  })

  describe('decode', () => {
    it('should encode all the special characters', () => {
      let input = 'This is a &lt;test&gt; &amp; &lt;another test&gt; &amp; &lt;a third&gt;'
      let expected = 'This is a <test> & <another test> & <a third>'
      assert.equal(encoder.decode(input), expected)
    })
  })
})
