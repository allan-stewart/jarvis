const crypto = require('crypto')

let generate = () => {
    return crypto.randomBytes(1)[0] / 0xFF
}

exports.setGenerator = generator => {
  generate = generator
}

exports.random = () => {
  return generate()
}

exports.randomInRange = (min, max)  => {
    return generate() * (max - min) + min
}

exports.randomInt = (min, max) => {
    return Math.floor(generate() * (max - min + 1) + min)
}

exports.shuffleArray = array => {
  let copy = array.concat()
  let result = []
  while (copy.length > 0) {
    let i = exports.randomInt(1, copy.length) - 1
    result = result.concat(copy.splice(i, 1))
  }
  return result
}

exports.generateBytes = length => {
  return crypto.randomBytes(length)
}
