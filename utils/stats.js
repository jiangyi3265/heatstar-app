/**
 * 首页与工作台的真实统计。
 *
 * 计分口径与积分中心保持一致：只算「已采纳且有星级」的提案，
 * 按最终审核日期落到计分月（超过截止日顺延到下月），星级按当前规则折算积分。
 */
import { getProposals, readStorage, STORAGE_KEYS } from './storage.js'
import { pointRules as defaultRules } from './mock.js'
import { inReviewScope, departmentId, canDepartmentVote, canRecommendProposal, userReviewLevels } from './organization.js'

const PENDING_BY_LEVEL = { team: 'pending_team', reviewer: 'pending_review', company: 'pending_company' }
const LEVELS_BY_SCOPE = { reviewer: ['reviewer'], team: ['team'], company: ['company'] }

export function activeRules() {
  const settings = readStorage(STORAGE_KEYS.settings, {}) || {}
  const stored = settings.pointRules || settings.points || settings
  return {
    oneStar: Number(stored.oneStar) || defaultRules.oneStar,
    twoStar: Number(stored.twoStar) || defaultRules.twoStar,
    threeStar: Number(stored.threeStar) || defaultRules.threeStar,
    cutoffDay: Number(stored.cutoffDay) || defaultRules.cutoffDay
  }
}

export function scoreFor(stars, rules) {
  const value = Number(stars)
  if (value === 3) return Number(rules.threeStar)
  if (value === 2) return Number(rules.twoStar)
  if (value === 1) return Number(rules.oneStar)
  return 0
}

export function accountingMonth(dateText, cutoffDay) {
  const match = String(dateText || '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return ''
  const date = new Date(Number(match[1]), Number(match[2]) - 1, 1)
  if (Number(match[3]) > Number(cutoffDay)) date.setMonth(date.getMonth() + 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function currentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/** 提案是不是这个人提的：优先按提交人工号，其次按第一作者姓名。 */
export function isMine(proposal, user) {
  if (!proposal || !user) return false
  const submitter = String(proposal.submitterId || proposal.authorWorkNo || '')
  if (submitter && (submitter === String(user.workNo) || submitter === String(user.id))) return true
  if (submitter) return false
  return departmentId(user) === departmentId(proposal) && Boolean(user.name) && proposal.firstAuthor === user.name
}

export function myProposals(user, proposals) {
  const source = proposals || getProposals()
  return source.filter(item => isMine(item, user))
}

/** 当前账号在指定计分月的积分、名次，以及本人在办数量。 */
export function personalSummary(user, options = {}) {
  const rules = options.rules || activeRules()
  const proposals = options.proposals || getProposals()
  const month = options.month || currentMonthKey()

  const totals = new Map()
  proposals.forEach(item => {
    if (departmentId(item) !== departmentId(user)) return
    if (item.status !== 'approved' || !Number(item.stars)) return
    const date = String(item.reviewedAt || item.submittedAt || '').slice(0, 10)
    if (accountingMonth(date, rules.cutoffDay) !== month) return
    const name = item.firstAuthor
    if (!name) return
    totals.set(name, (totals.get(name) || 0) + scoreFor(item.stars, rules))
  })

  const ranking = Array.from(totals.entries())
    .map(([name, points]) => ({ name, points }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, 'zh-CN'))

  const name = (user && user.name) || ''
  const index = ranking.findIndex(item => item.name === name)
  const mine = myProposals(user, proposals)

  return {
    month,
    monthPoints: totals.get(name) || 0,
    processing: mine.filter(item => String(item.status || '').startsWith('pending')).length,
    rank: index >= 0 ? index + 1 : 0,
    rankTotal: ranking.length,
    mineCount: mine.length,
    ranking
  }
}

/** 当前账号管辖范围内、已流转到自己这一级（含下级）的待办数量。 */
export function reviewPendingCount(user, proposals) {
  const levels = userReviewLevels(user)
  if (!levels.length && !user?.canRecommend) return 0
  const source = proposals || getProposals()
  const statuses = levels.map(level => PENDING_BY_LEVEL[level])
  return source.filter(item => {
    if (canRecommendProposal(user, item)) return true
    if (!statuses.includes(item.status)) return false
    if (item.status === 'pending_review' && !user?.isSuper && !canDepartmentVote(user, item)) return false
    return inReviewScope(user, item, Object.keys(PENDING_BY_LEVEL).find(level => PENDING_BY_LEVEL[level] === item.status))
  }).length
}

export function noticeCount() {
  const notices = readStorage(STORAGE_KEYS.notices, []) || []
  return notices.filter(item => !item.status || item.status === '已发布').length
}

export function candidateCount() {
  const candidates = readStorage(STORAGE_KEYS.candidates, {}) || {}
  const people = Array.isArray(candidates.people) ? candidates.people : []
  return people.length
}

/** 最近几个计分月，供积分中心切换用。 */
export function recentMonths(count = 3, from = new Date()) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(from.getFullYear(), from.getMonth() - index, 1)
    const month = date.getMonth() + 1
    return {
      value: `${date.getFullYear()}-${String(month).padStart(2, '0')}`,
      label: `${date.getFullYear()} 年 ${month} 月`,
      shortLabel: `${month} 月`
    }
  })
}

const QUARTER_NAMES = ['第一季度', '第二季度', '第三季度', '第四季度']

export function quarterOf(date = new Date()) {
  const index = Math.floor(date.getMonth() / 3)
  return {
    index: index + 1,
    year: date.getFullYear(),
    key: `${date.getFullYear()}Q${index + 1}`,
    label: `${date.getFullYear()} 年${QUARTER_NAMES[index]}`,
    compactLabel: `${date.getFullYear()}年${QUARTER_NAMES[index]}`
  }
}

export function greeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 6) return '夜里好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

/** 「8 月积分统计截止：25 日」这类文案，按当前月和规则里的截止日生成。 */
export function cutoffText(rules) {
  const active = rules || activeRules()
  const now = new Date()
  return `${now.getMonth() + 1} 月积分统计截止：${active.cutoffDay} 日`
}
