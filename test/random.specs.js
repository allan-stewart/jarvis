const random = require('../src/random')
const assert = require('assert')

describe('random', () => {
  let randomValues

  beforeEach(() => {
    let i = -1
    randomValues = [0, .1, .2, .3, .4, .5, .6, .7, .8, .9]
    random.setGenerator(() => {
      i = (i + 1) % randomValues.length
      return randomValues[i]
    })
  })

  describe('random', () => {
    it('returns a random number in [0, 1)', () => {
      assert.equal(random.random(), 0)
      assert.equal(random.random(), 0.1)
      assert.equal(random.random(), 0.2)
    })
  })

  describe('randomInt', () => {
    it('returns a random integer in [min, max]', () => {
      assert.equal(random.randomInt(2, 5), 2)
      assert.equal(random.randomInt(2, 5), 2)
      assert.equal(random.randomInt(2, 5), 2)
      assert.equal(random.randomInt(2, 5), 3)
      assert.equal(random.randomInt(2, 5), 3)
      assert.equal(random.randomInt(2, 5), 4)
      assert.equal(random.randomInt(2, 5), 4)
      assert.equal(random.randomInt(2, 5), 4)
      assert.equal(random.randomInt(2, 5), 5)
      assert.equal(random.randomInt(2, 5), 5)
      assert.equal(random.randomInt(2, 5), 2)
    })

    describe('shuffleArray', () => {
      it('should mix up an array', () => {
        randomValues = [.9, .1, .6]
        let input = ['a', 'b', 'c', 'd']
        let result = random.shuffleArray(input)
        assert.deepEqual(result, ['d', 'a', 'c', 'b'])
      })
    })
  })
})
