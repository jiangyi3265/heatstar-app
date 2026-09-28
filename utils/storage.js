import { queueStatePush, saveProposalRemote, markDirty } from './api.js'

export const STORAGE_KEYS = {
  proposals: 'heatstar_proposals',
  people: 'heatstar_people',
  teams: 'heatstar_teams',
  departments: 'heatstar_departments',
  permissions: 'heatstar_permissions',
  notices: 'heatstar_notices',
  settings: 'heatstar_settings',
  candidates: 'heatstar_candidates',
  shares: 'heatstar_shares'
}

export function readStorage(key, fallback) {
  try {
    const value = uni.getStorageSync(key)
    return value === '' || value === undefined || value === null ? fallback : value
  } catch (error) {
    return fallback
  }
}

export function writeStorage(key, value) {
  uni.setStorageSync(key, value)
  queueStatePush(key, value)
  return value
}

/** 提案只认服务器同步下来的数据，不再混入演示样例。 */
export function getProposals() {
  const local = readStorage(STORAGE_KEYS.proposals, [])
  const list = Array.isArray(local) ? local.filter(item => item && item.id) : []
  return list
    .slice()
    .sort((a, b) => String(b.submittedAt || '').localeCompare(String(a.submittedAt || '')))
}

/** 提交与审核必须收到服务端确认后才显示成功。失败时由表单保留草稿。 */
export async function saveProposalConfirmed(proposal) {
  const saved = await saveProposalRemote(proposal)
  const list = getProposals()
  const index = list.findIndex(item => item.id === saved.id)
  if (index >= 0) list.splice(index, 1, saved)
  else list.unshift(saved)
  uni.setStorageSync(STORAGE_KEYS.proposals, list)
  return saved
}

/**
 * 保存提案：本地先落一份保证界面即时更新，再单条提交给服务端合并。
 * 不能整表推送——那样会把别人同时提交的提案覆盖掉。
 */
export function saveProposal(proposal) {
  const local = getProposals()
  const index = local.findIndex(item => item.id === proposal.id)
  if (index >= 0) local.splice(index, 1, proposal)
  else local.unshift(proposal)
  uni.setStorageSync(STORAGE_KEYS.proposals, local)

  saveProposalRemote(proposal)
    .then(saved => {
      // 服务端会以自己的时间改写提交/审核时间，回写本地保持一致
      if (!saved || !saved.id) return
      const list = getProposals()
      const at = list.findIndex(item => item.id === saved.id)
      if (at >= 0) list.splice(at, 1, saved)
      else list.unshift(saved)
      uni.setStorageSync(STORAGE_KEYS.proposals, list)
    })
    .catch(() => {
      // 服务器暂时不可达：标记待同步，恢复连接后由 ensureSynchronized 补传
      markDirty(STORAGE_KEYS.proposals)
    })
  return proposal
}

export function nextProposalNo(type = 'lean') {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const settings = readStorage(STORAGE_KEYS.settings, {}) || {}
  const user = readStorage('heatstar_user', {})
  const department = readStorage(STORAGE_KEYS.departments, []).find(d => d.id === user.departmentId)
  const departmentCode = user.departmentId && user.departmentId !== 'heat-treatment' ? department?.code : ''
  const digits = Math.min(6, Math.max(3, Number(settings.sequenceDigits || 4)))
  const seq = String(getProposals().filter(item => item.type === type).length + 1).padStart(digits, '0')
  if (type === 'lean') return `JY-${departmentCode || 'RT'}-${yyyy}-${seq}`
  if (type === 'tool') return `GJ-${departmentCode || 'RT'}-${yyyy}-${seq}`
  if (type === 'opl') return `OPL-${departmentCode || 'RT'}-${yyyy}-${seq}`
  const code = String(departmentCode || settings.workshopCode || 'RTC').replace(/[^A-Z0-9]/g, '') || 'RTC'
  const cycle = settings.resetCycle || 'monthly'
  const period = cycle === 'quarterly' ? `${yyyy}Q${Math.floor(now.getMonth() / 3) + 1}` : cycle === 'yearly' ? String(yyyy) : cycle === 'never' ? 'ALL' : `${yyyy}${mm}`
  return `${code}-LY-${period}-${seq}`
}

export function formatNow() {
  const date = new Date()
  const pad = value => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
