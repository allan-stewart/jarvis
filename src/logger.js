const logLevels = ['DEBUG', 'INFO', 'WARN', 'ERROR']
let currentLevel = 1

module.exports = {
  setLogLevel: (newLevel) => {
    currentLevel = logLevels.indexOf(newLevel)
    if (currentLevel < 0) {
      currentLevel = 1
    }
  },

  debug: (message) => logMessage(0, message),
  info: (message) => logMessage(1, message),
  warn: (message) => logMessage(2, message),
  error: (message) => logMessage(3, message)
}

const logMessage = (level, message) => {
  if (level >= currentLevel) {
    console.log(`[${new Date().toISOString()}] [${logLevels[level]}] ${message}`)
  }
}
