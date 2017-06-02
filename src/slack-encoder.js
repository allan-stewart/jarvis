const encodeMap = [
  {regex: /&/g, value: '&amp;'},
  {regex: /</g, value: '&lt;'},
  {regex: />/g, value: '&gt;'}
]

exports.encode = (message) => {
  return encodeMap.reduce((x, map) => {
    return x.replace(map.regex, map.value)
  }, message)
}

const decodeMap = [
  {regex: /&amp;/g, value: '&'},
  {regex: /&lt;/g, value: '<'},
  {regex: /&gt;/g, value: '>'}
]

exports.decode = (message) => {
  return decodeMap.reduce((x, map) => {
    return x.replace(map.regex, map.value)
  }, message)
}
