const PRODUCTION_API = 'https://gy.rechuangxing.xyz/api'
const TOKEN_KEY = 'heatstar_token'

let syncPromise = null
let lastSyncAt = 0
let unauthorizedHandler = null

export function authToken() {
  try {
    return uni.getStorageSync(TOKEN_KEY) || ''
  } catch (error) {
    return ''
  }
}

export function setAuthToken(token) {
  if (token) uni.setStorageSync(TOKEN_KEY, token)
  else uni.removeStorageSync(TOKEN_KEY)
  lastSyncAt = 0
}

/** 由 session.js 注册：服务端说登录失效时，统一跳登录页。 */
export function onUnauthorized(handler) {
  unauthorizedHandler = handler
}

function withAuth(header = {}) {
  const token = authToken()
  return token ? { ...header, Authorization: `Bearer ${token}` } : { ...header }
}

function reportAuthFailure(data, options = {}) {
  if (options.skipAuthRedirect) return
  if (data && data.auth && typeof unauthorizedHandler === 'function') unauthorizedHandler(data)
}

export function apiBase() {
  const configured = uni.getStorageSync('heatstar_api_base')
  if (configured) return String(configured).replace(/\/$/, '')

  let base = PRODUCTION_API
  // #ifdef H5
  if (typeof window !== 'undefined') {
    const local = ['localhost', '127.0.0.1'].includes(window.location.hostname)
    base = local ? 'http://127.0.0.1:8765/api' : `${window.location.origin}/api`
  }
  // #endif
  return base
}

export function apiUrl(path = '') {
  if (/^https?:\/\//i.test(path)) return path
  return `${apiBase()}${path.startsWith('/') ? path : `/${path}`}`
}

function parseResponse(data) {
  if (typeof data !== 'string') return data
  try { return JSON.parse(data) } catch (error) { return { ok: false, message: data || '服务器返回格式错误' } }
}

export function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    uni.request({
      url: apiUrl(path),
      method: options.method || 'GET',
      data: options.data,
      timeout: options.timeout || 12000,
      header: withAuth({ 'Content-Type': 'application/json', ...(options.header || {}) }),
      success: response => {
        const data = parseResponse(response.data)
        if (response.statusCode >= 200 && response.statusCode < 300 && data?.ok !== false) {
          resolve(data)
          return
        }
        if (response.statusCode === 401 || response.statusCode === 403) reportAuthFailure(data, options)
        reject(new Error(data?.message || `请求失败（${response.statusCode}）`))
      },
      fail: error => reject(new Error(error?.errMsg || '无法连接服务器'))
    })
  })
}

export function uploadAsset(filePath, options = {}) {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: apiUrl(`/upload?kind=${encodeURIComponent(options.kind || 'attachment')}`),
      filePath,
      name: 'file',
      header: withAuth(),
      formData: { originalName: options.name || '' },
      timeout: 60000,
      success: response => {
        const data = parseResponse(response.data)
        if (response.statusCode >= 200 && response.statusCode < 300 && data?.ok) {
          resolve({ ...data.file, url: apiUrl(data.file.url) })
          return
        }
        if (response.statusCode === 401 || response.statusCode === 403) reportAuthFailure(data, options)
        reject(new Error(data?.message || `上传失败（${response.statusCode}）`))
      },
      fail: error => reject(new Error(error?.errMsg || '上传失败'))
    })
  })
}

export function previewPersonnelWorkbook(filePath, name = '') {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: apiUrl('/import/personnel/preview'),
      filePath,
      name: 'file',
      header: withAuth(),
      formData: { originalName: name },
      timeout: 60000,
      success: response => {
        const data = parseResponse(response.data)
        if (response.statusCode >= 200 && response.statusCode < 300 && data?.ok) {
          resolve(data)
          return
        }
        if (response.statusCode === 401 || response.statusCode === 403) reportAuthFailure(data)
        reject(new Error(data?.message || 'Excel 解析失败'))
      },
      fail: error => reject(new Error(error?.errMsg || 'Excel 上传失败'))
    })
  })
}

export function downloadFile(path, options = {}) {
  const url = apiUrl(path)
  // #ifdef H5
  if (typeof window !== 'undefined') {
    // 走 fetch 带令牌，而不是把令牌拼进地址栏。
    return fetch(url, {
      method: options.data ? 'POST' : 'GET',
      headers: withAuth(options.data ? { 'Content-Type': 'application/json' } : {}),
      body: options.data ? JSON.stringify(options.data) : undefined
    }).then(async response => {
      if (!response.ok) {
        const data = parseResponse(await response.text())
        if (response.status === 401 || response.status === 403) reportAuthFailure(data)
        throw new Error(data?.message || `下载失败（${response.status}）`)
      }
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = options.fileName || decodeURIComponent((path.split('?')[0].split('/').pop()) || 'download')
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      setTimeout(() => URL.revokeObjectURL(objectUrl), 4000)
      return objectUrl
    })
  }
  // #endif
  return new Promise((resolve, reject) => {
    uni.downloadFile({
      url: options.data?.ids
        ? `${url}${url.includes('?') ? '&' : '?'}${options.data.ids.map(id => `id=${encodeURIComponent(id)}`).join('&')}`
        : url,
      header: withAuth(),
      success: response => {
        if (response.statusCode !== 200) {
          reject(new Error(`下载失败（${response.statusCode}）`))
          return
        }
        if (options.open === false) {
          resolve(response.tempFilePath)
          return
        }
        uni.openDocument({
          filePath: response.tempFilePath,
          fileType: options.fileType,
          showMenu: true,
          success: () => resolve(response.tempFilePath),
          fail: error => reject(new Error(error?.errMsg || '文件打开失败'))
        })
      },
      fail: error => reject(new Error(error?.errMsg || '下载失败'))
    })
  })
}

function dirtyKeys() {
  const value = uni.getStorageSync('heatstar_dirty_keys')
  return Array.isArray(value) ? value : []
}

export function markDirty(key) {
  const keys = new Set(dirtyKeys())
  keys.add(key)
  uni.setStorageSync('heatstar_dirty_keys', Array.from(keys))
}

function clearDirty(key) {
  uni.setStorageSync('heatstar_dirty_keys', dirtyKeys().filter(item => item !== key))
}

export async function pushState(key, value) {
  if (!authToken()) throw new Error('尚未登录，无法同步到服务器')
  const result = await request(`/state/${encodeURIComponent(key)}`, {
    method: 'PUT',
    data: { value, clientUpdatedAt: new Date().toISOString() }
  })
  clearDirty(key)
  uni.setStorageSync('heatstar_last_server_sync', Date.now())
  return result
}

export function queueStatePush(key, value) {
  if (!authToken()) return
  markDirty(key)
  pushState(key, value).catch(() => {})
}

export async function ensureSynchronized(force = false) {
  if (!authToken()) return { ok: false, needLogin: true, message: '尚未登录' }
  const now = Date.now()
  if (!force && now - lastSyncAt < 2500) return { ok: true, cached: true }
  if (syncPromise) return syncPromise

  syncPromise = (async () => {
    try {
      const result = await request('/bootstrap')
      const pending = new Set(dirtyKeys())
      const states = result.states || {}
      for (const [key, value] of Object.entries(states)) {
        if (pending.has(key)) {
          const local = uni.getStorageSync(key)
          await pushState(key, local)
        } else {
          uni.setStorageSync(key, value)
        }
      }
      lastSyncAt = Date.now()
      uni.setStorageSync('heatstar_last_server_sync', lastSyncAt)
      uni.setStorageSync('heatstar_server_online', true)
      return result
    } catch (error) {
      uni.setStorageSync('heatstar_server_online', false)
      return { ok: false, offline: true, message: error.message }
    } finally {
      syncPromise = null
    }
  })()
  return syncPromise
}

export function serverStatus() {
  return {
    online: Boolean(uni.getStorageSync('heatstar_server_online')),
    lastSyncAt: Number(uni.getStorageSync('heatstar_last_server_sync') || 0)
  }
}

export async function reserveSixSourceNumber() {
  return reserveProposalNumber('six')
}

/** 编号一律由服务端发放，两个人同时提交也不会撞号。 */
export async function reserveProposalNumber(type = 'six') {
  const result = await request(`/numbers/proposal?type=${encodeURIComponent(type)}`, { method: 'POST', data: {} })
  return result.number
}

/**
 * 单条提案提交给服务端合并。
 * 早期版本是把整张提案表推上去覆盖，两个人同时提交会互相抹掉。
 */
export async function saveProposalRemote(proposal) {
  const result = await request('/proposals/save', { method: 'POST', data: { proposal } })
  return result.proposal
}
