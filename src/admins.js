const logger = require('./logger')
const storageId = 'admins'

let admins = []
let storage = null


exports.load = (controller) => {
  storage = controller.storage.teams
  storage.get(storageId, (error, data) => {
    if (error) {
      logger.error('Unable to load admins', error)
      return
    }
    admins = data.admins
    logger.info(`Loaded ${admins.length} admins`)
  })
}

exports.any = () => {
  return admins.length > 0
}

exports.getAll = () => {
  return admins
}

exports.getAdmin = (userId) => {
  return admins.find(x => x.userId == userId)
}

exports.addAdmin = (userId, honorific) => {
  admins.push({userId, honorific})
  storage.save({id: storageId, admins})
}
