const fileSystem = require('fs')

exports.load = (controller) => {
    files = fileSystem.readdirSync(`${__dirname}/skills`)
    files.forEach(x => require(`./skills/${x}`)(controller))
}
