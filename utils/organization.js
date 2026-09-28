import { readStorage, STORAGE_KEYS } from './storage.js'

export const DEFAULT_DEPARTMENT_ID = 'heat-treatment'
export const departmentId = item => item?.departmentId || DEFAULT_DEPARTMENT_ID
export function getDepartments() {
  return readStorage(STORAGE_KEYS.departments, [{id: DEFAULT_DEPARTMENT_ID, name: '热处理厂', code: 'RTC', status: '启用'}])
}
export function departmentName(item) {
  return getDepartments().find(d => d.id === departmentId(item))?.name || item?.department || '热处理厂'
}
export function reviewScopeLabel(user, stage) {
  if (!user?.isSuper && stage && user?.scopeByLevel) return user.scopeByLevel[stage]?.scope || '未配置范围'
  return user?.isSuper || user?.accessLevel === 'company' || user?.reviewLevel === 'company' ? '全公司' : (user?.scope || user?.department || '未配置范围')
}
export function inReviewScope(user, item, stage) {
  if (user?.isSuper) return true
  if (user?.scopeByLevel) {
    const grants = stage ? (user.scopeByLevel[stage] ? [[stage, user.scopeByLevel[stage]]] : []) : Object.entries(user.scopeByLevel)
    return grants.some(([reviewLevel, grant]) => inReviewScope({ ...grant, reviewLevel }, item))
  }
  const level = user?.reviewLevel || user?.accessLevel
  if (level === 'company') return true
  const scopes = String(user?.scope || '').split(/[、,，;；\n]/).map(s => s.trim()).filter(Boolean)
  if (['reviewer','specialist'].includes(level)) return (user?.departmentScopes?.length ? user.departmentScopes : [departmentId(user)]).includes(departmentId(item))
  if (departmentId(user) !== departmentId(item)) return false
  if (level === 'factory') return true
  const field = level === 'team' ? 'team' : level === 'section' ? 'section' : ''
  if (!field) return false
  const selected = !scopes.length || scopes.every(s => ['本人','班组','本班组','工段','本工段'].includes(s)) ? [user[field]] : scopes
  return selected.includes(item[field])
}
export const REVIEW_LEVELS = {team: ['team'], reviewer: ['reviewer'], company: ['company']}
export function userReviewLevels(user) { return user?.isSuper ? ['team','reviewer','company'] : user?.reviewLevels || REVIEW_LEVELS[user?.reviewLevel] || [] }
export function canDepartmentVote(user, item) {
  if (!userReviewLevels(user).includes('reviewer') || !inReviewScope(user, item, 'reviewer') || item.status !== 'pending_review') return false
  const ballot = item.departmentReview || {}
  if ((ballot.votes || []).some(v => v.workNo === user.workNo)) return false
  if (ballot.members?.length) return ballot.members.some(m => m.workNo === user.workNo)
  return userReviewLevels(user).includes('reviewer') && !user.isSuper
}
export function canRecommendProposal(user, item) {
  return Boolean((user.canRecommend || user.isSuper) && inReviewScope(user, item, 'specialist') && item.status === 'approved' &&
    item.finalReviewLevel === 'department' && item.departmentReview?.completed)
}
