let data = {
    self: {id: ''},
    team: {id: '', name: '', domain: ''}
}

exports.setData = (newData) => data = newData

exports.getJarvisId = () => data.self.id
exports.getTeamId = () => data.team.id
exports.getTeamName = () => data.team.name
exports.getTeamDomain = () => data.team.domain