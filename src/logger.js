const logLevels = ['DEBUG', 'INFO', 'WARN', 'ERROR']
let currentLevel = 1

module.exports = {
  setLogLevel: (newLevel) => {
    currentLevel = logLevels.indexOf(newLevel)
    if (currentLevel < 0) {
      currentLevel = 1
    }
  },
  disable: () => {
    currentLevel = logLevels.length
  },

  debug: function () { logMessage(0, arguments) },
  info: function () { logMessage(1, arguments) },
  warn: function () { logMessage(2, arguments) },
  error: function () { logMessage(3, arguments) }
}

const logMessage = (level, data) => {
  if (level >= currentLevel) {
    console.log.apply(null, [`[${new Date().toISOString()}] [${logLevels[level]}]`, ...data])
  }
}
