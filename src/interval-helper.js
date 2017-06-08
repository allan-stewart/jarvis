exports.until = (data) => {
  let until = new Date().valueOf() + data.untilMsFromNow
  let interval = setInterval(() => {
    if (new Date().valueOf() > until) {
      clearInterval(interval)
      data.onEnd()
    } else {
      data.onInterval()
    }
  }, data.intervalMs)
}
