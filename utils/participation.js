const EMPTY_MEMBER_LABELS = new Set(['', '无', '暂无', '未填写', '未配置', '-'])

function cleanName(value) {
  return String(value == null ? '' : value).trim()
}

/**
 * 团队成员历史数据既可能是数组，也可能是用顿号、逗号、空格分隔的字符串。
 * 统一在这里清洗，避免同一个人在不同报表里被重复或遗漏统计。
 */
export function splitMemberNames(value) {
  const source = Array.isArray(value) ? value : String(value == null ? '' : value).split(/[、,，;；/|\n\t\s]+/)
  const result = []
  source.forEach(item => {
    const name = cleanName(typeof item === 'object' ? item.name || item.label || item.value : item)
    if (!EMPTY_MEMBER_LABELS.has(name) && !result.includes(name)) result.push(name)
  })
  return result
}

/** 一份提案内同一个人只计一次参与，第一作者优先于团队成员身份。 */
export function proposalParticipants(proposal) {
  const lead = cleanName(proposal && proposal.firstAuthor)
  const rows = []
  if (lead) rows.push({ name: lead, role: 'lead' })
  splitMemberNames(proposal && proposal.members).forEach(name => {
    if (name !== lead) rows.push({ name, role: 'support' })
  })
  return rows
}

function personIndex(people) {
  return new Map((Array.isArray(people) ? people : []).filter(item => item && item.name).map(item => [cleanName(item.name), item]))
}

function fallbackMeta(name, proposal, index) {
  const person = index.get(name) || {}
  return {
    workNo: person.workNo || person.id || '',
    team: person.team || proposal.team || '未登记班组',
    section: person.section || proposal.section || '未登记工段'
  }
}

/**
 * 团队成员参与贡献榜。第一作者角色不进入榜单；同一个人只有以团队成员身份
 * 参与其他项目时才会出现，同一项目的重复姓名只计一次。
 */
export function buildParticipantRows(proposals, people) {
  const index = personIndex(people)
  const rows = new Map()
  ;(Array.isArray(proposals) ? proposals : []).forEach((proposal, proposalIndex) => {
    if (!proposal) return
    const projectKey = cleanName(proposal.id || proposal.sourceNo || `${proposal.title || 'project'}-${proposalIndex}`)
    proposalParticipants(proposal).filter(participant => participant.role === 'support').forEach(participant => {
      const meta = fallbackMeta(participant.name, proposal, index)
      const current = rows.get(participant.name) || {
        name: participant.name,
        workNo: meta.workNo,
        team: meta.team,
        section: meta.section,
        projectKeys: new Set(),
        supportKeys: new Set()
      }
      current.projectKeys.add(projectKey)
      current.supportKeys.add(projectKey)
      rows.set(participant.name, current)
    })
  })

  return Array.from(rows.values())
    .map(item => {
      const projectCount = item.projectKeys.size
      const supportCount = item.supportKeys.size
      const supportOnly = supportCount >= 2
      return {
        name: item.name,
        workNo: item.workNo,
        team: item.team,
        section: item.section,
        projectCount,
        leadCount: 0,
        supportCount,
        supportOnly,
        badge: supportOnly ? '协作骨干' : ''
      }
    })
    .sort((a, b) => b.projectCount - a.projectCount || b.supportCount - a.supportCount || a.name.localeCompare(b.name, 'zh-CN'))
    .map((item, index) => ({ ...item, rank: index + 1 }))
}

function teamHeadcount(team, people) {
  const rosterCount = people.filter(person => person && person.team === team.name).length
  return Math.max(1, Number(team.members) || rosterCount || 1)
}

/**
 * 班组、工段参与率。分子按第一作者和团队成员去重，分母优先使用班组维护中的编制人数。
 */
export function buildOrganizationParticipation(proposals, people, teams) {
  const safePeople = Array.isArray(people) ? people : []
  const safeTeams = Array.isArray(teams) ? teams : []
  const safeProposals = Array.isArray(proposals) ? proposals : []
  const participationProposals = safeProposals.filter(item => proposalParticipants(item).some(person => person.role === 'support'))
  const participantRows = buildParticipantRows(participationProposals, safePeople)

  const teamRows = safeTeams.map(team => {
    const members = teamHeadcount(team, safePeople)
    const participants = participantRows.filter(person => person.team === team.name).length
    const projectCount = participationProposals.filter(item => item && item.team === team.name).length
    return {
      name: team.name,
      section: team.section || '未登记工段',
      participants,
      members,
      projectCount,
      participation: Math.min(100, Math.round(participants / members * 100))
    }
  })

  const sectionNames = Array.from(new Set([
    ...safeTeams.map(item => item && item.section),
    ...safePeople.map(item => item && item.section),
    ...participationProposals.map(item => item && item.section)
  ].filter(Boolean)))
  const sectionRows = sectionNames.map(name => {
    const sectionTeams = safeTeams.filter(team => team.section === name)
    const members = sectionTeams.length
      ? sectionTeams.reduce((total, team) => total + teamHeadcount(team, safePeople), 0)
      : Math.max(1, safePeople.filter(person => person.section === name).length)
    const participants = participantRows.filter(person => person.section === name).length
    const projectCount = participationProposals.filter(item => item && item.section === name).length
    return {
      name,
      participants,
      members,
      projectCount,
      participation: Math.min(100, Math.round(participants / members * 100))
    }
  })

  const rank = rows => rows
    .filter(item => item.projectCount > 0 || item.participants > 0)
    .sort((a, b) => b.participation - a.participation || b.participants - a.participants || b.projectCount - a.projectCount || a.name.localeCompare(b.name, 'zh-CN'))
    .map((item, index) => ({ ...item, rank: index + 1 }))

  const factoryMembers = Math.max(1, safeTeams.reduce((total, team) => total + teamHeadcount(team, safePeople), 0) || safePeople.length)
  return {
    people: participantRows,
    teams: rank(teamRows),
    sections: rank(sectionRows),
    factory: {
      participants: participantRows.length,
      members: factoryMembers,
      projectCount: participationProposals.length,
      supportOnly: participantRows.filter(item => item.supportOnly).length,
      participation: Math.min(100, Math.round(participantRows.length / factoryMembers * 100))
    }
  }
}
