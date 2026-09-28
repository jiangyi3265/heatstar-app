import { departmentId, inReviewScope } from './organization.js'
import { configuredLevels, configuredRoles, dutyScopes } from './permissions.js'

const INACTIVE = new Set(['已移除', '离职', '离岗', '停用', '禁用'])

// Match the server's department ballot membership rules, including named legacy scopes.
export function departmentReviewers(people, departments, id) {
  const members = new Map()
  for (const person of people) {
    if (!configuredLevels(person).includes('评审员') || !configuredRoles(person).some(r => ['审核者','管理员'].includes(r)) || INACTIVE.has(person.status)) continue
    const names = String(person.scope || '').split(/[、,，;；\n]/).map(name => name.trim()).filter(Boolean)
    const named = departments.filter(d => names.includes(d.name)).map(d => d.id)
    const scopes = dutyScopes(person, departments, '评审员')
    const workNo = String(person.workNo || person.id || '').trim()
    if (workNo && scopes.includes(id)) members.set(workNo, { workNo, name: person.name || workNo })
  }
  return [...members.values()]
}

export function reviewDepartments(user, departments, stage) {
  if (user.scopeByLevel && !user.isSuper) return departments.filter(d => inReviewScope(user, {departmentId:d.id}, stage))
  return departments.filter(d => user.isSuper || user.accessLevel === 'company' || user.reviewLevel === 'company' ||
    (['reviewer', 'specialist'].includes(user.reviewLevel || user.accessLevel)
      ? inReviewScope(user, { departmentId: d.id }) : departmentId(user) === d.id))
}

export function processedAtLevel(item, level, user) {
  const history = item.reviewHistory || []
  const mine = record => user.isSuper || record.reviewerWorkNo === user.workNo
  if (history.some(record => record.level === level && mine(record))) return true
  if (level === 'reviewer') {
    return (item.departmentReview?.votes || []).some(vote => user.isSuper || vote.workNo === user.workNo) ||
      history.some(record => ['section', 'factory'].includes(record.level) && mine(record))
  }
  return false
}

export function departmentProgress(item) {
  const ballot = item.departmentReview
  if (!ballot?.members?.length) return item.status === 'pending_review' ? '部门评审：本轮名单待确认' : ''
  const members = new Set(ballot.members.map(member => member.workNo))
  const count = new Set((ballot.votes || []).filter(vote => members.has(vote.workNo)).map(vote => vote.workNo)).size
  const state = ballot.completed ? '已完成' : item.status === 'rejected' ? '已驳回' : '进行中'
  return `部门评审${state} · 已评 ${count}/${members.size} 人`
}
