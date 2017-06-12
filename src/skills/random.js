const random = require('../random')
const colors = require('../colors')

module.exports = (controller, skillData) => {

  controller.hears([/random (number|integer|int|float) (?:between|from) (\d+) (?:and|to) (\d+)$/i,], ['direct_message','direct_mention','mention'], (bot, message) => {
    let intTypes = ['integer', 'int']
    let replyInteger = intTypes.includes(message.match[1].toLowerCase())
    let min = Math.min(message.match[2])
    let max = Math.max(message.match[3])
    let result = replyInteger ? random.randomInt(min, max) : random.randomInRange(min, max)
    bot.reply(message, `${result}`)
  })

  controller.hears([/random (number|float)/i,], ['direct_message','direct_mention','mention'], (bot, message) => {
    bot.reply(message, `${random.random()}`)
  })

  controller.hears([/randomize into (\d+) groups: (.*)$/i,], ['direct_message','direct_mention','mention'], (bot, message) => {
    let numberOfGroups = message.match[1]
    let members = message.match[2].split(',').map(x => x.trim()).filter(x => x.length > 0)
    let shuffled = random.shuffleArray(members)
    let grouped = groupArray(shuffled, numberOfGroups)

    let lines = grouped.map((x, index) => `*Group ${(index + 1)}:* ${x.join(', ')}`)
    bot.reply(message, {
      text: '',
      attachments: [
        {
          fallback: `The groups have been randomized.`,
          text: lines.join('\n'),
          mrkdwn_in: ['text'],
          color: colors.default
        }
      ]
    })
  })

  controller.hears([/generate (\d+) random bytes in (hex|hexadecimal|base64)/i,], ['direct_message','direct_mention','mention'], (bot, message) => {
    let count = parseInt(message.match[1], 10)
    let output = message.match[2]
    bot.reply(message, `${random.generateBytes(count).toString(output)}`)
  })

  skillData.publicCommand('generate a random decimal number: `random <number|float>[ between <min> and <max>]`')
  skillData.publicCommand('generate a random integer: `random <int|integer>[ between <min> and <max>]`')
  skillData.publicCommand('randomize into groups: `randomize into <int> groups: <comma-separated-list>`')
  skillData.publicCommand('generate random bytes: `generate <int> random bytes in <hex|base64>`')
}

const groupArray = (array, numberOfGroups) => {
  let groups = []
  let groupIndex = 0
  array.forEach((item, index) => {
    if (!groups[groupIndex]) {
      groups.push([])
    }
    groups[groupIndex].push(item)
    groupIndex = (groupIndex + 1) % numberOfGroups
  })
  return groups
}
