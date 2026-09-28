/**
 * 登录会话。
 *
 * 令牌与用户资料存在本机，权限判断一律以服务端返回的 user 为准；
 * 页面通过 requireLogin() / requireAdmin() 做门禁，登录失效时统一跳登录页。
 */
import { request, authToken, setAuthToken, onUnauthorized, ensureSynchronized } from './api.js'

import { userReviewLevels } from './organization.js'

const USER_KEY = 'heatstar_user'
export const LOGIN_PAGE = '/pages/auth/login'
export const HOME_PAGE = '/pages/index/index'

let redirecting = false

export function currentUser() {
  try {
    const value = uni.getStorageSync(USER_KEY)
    return value && typeof value === 'object' && value.workNo ? value : null
  } catch (error) {
    return null
  }
}

function storeUser(user) {
  if (user && user.workNo) uni.setStorageSync(USER_KEY, user)
  else uni.removeStorageSync(USER_KEY)
  return user || null
}

export function isLoggedIn() {
  return Boolean(authToken() && currentUser())
}

export function isAdmin() {
  const user = currentUser()
  return Boolean(user && user.isAdmin)
}

export function canReview() {
  const user = currentUser()
  return Boolean(user && (user.reviewLevel || user.canRecommend))
}

/** 当前用户评审层级：team / reviewer，空表示不参与评审。 */
export function reviewLevel() {
  const user = currentUser()
  return (user && user.reviewLevel) || ''
}

/** 当前用户可处理的阶段；超级管理员的应急权限由页面单独处理。 */
export function reviewLevels() {
  return userReviewLevels(currentUser())
}

export function displayName() {
  const user = currentUser()
  return (user && user.name) || ''
}

export function clearSession() {
  setAuthToken('')
  storeUser(null)
}

export async function login(workNo, password) {
  const result = await request('/auth/login', {
    method: 'POST',
    data: { workNo, password },
    skipAuthRedirect: true
  })
  setAuthToken(result.token)
  storeUser(result.user)
  redirecting = false
  await ensureSynchronized(true)
  return result.user
}

export async function logout({ redirect = true } = {}) {
  try {
    await request('/auth/logout', { method: 'POST', data: {}, skipAuthRedirect: true })
  } catch (error) {
    // 服务器不可达也要让本机退出登录。
  }
  clearSession()
  if (redirect) {
    redirecting = false
    uni.reLaunch({ url: LOGIN_PAGE })
  }
}

/** 用服务端资料刷新本机用户，人员名单改过之后角色能立刻生效。 */
export async function refreshUser() {
  if (!authToken()) return null
  try {
    const result = await request('/auth/session', { skipAuthRedirect: true })
    return storeUser(result.user)
  } catch (error) {
    return currentUser()
  }
}

export async function changePassword(oldPassword, newPassword) {
  const result = await request('/auth/password', {
    method: 'POST',
    data: { oldPassword, newPassword },
    skipAuthRedirect: true
  })
  if (result.user) storeUser(result.user)
  return result
}

export async function resetPassword(workNo) {
  return request('/auth/reset', { method: 'POST', data: { workNo } })
}

export async function listAccounts() {
  return request('/auth/accounts')
}

/**
 * 后台页只在后台域名下开放（App.vue 的域名分流会把员工域名上的后台页踢回首页），
 * 所以管理员在员工端点后台入口时，直接把他送到后台域名，而不是让他进去再被踢出来。
 */
export function openAdminPage(path) {
  // #ifdef H5
  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase()
    const local = ['localhost', '127.0.0.1'].includes(host)
    if (!local && !host.startsWith('gyht.')) {
      const adminHost = host.replace(/^gy\./i, 'gyht.')
      if (adminHost !== host) {
        window.location.href = `${window.location.protocol}//${adminHost}/#${path}`
        return
      }
    }
  }
  // #endif
  uni.navigateTo({ url: path })
}

function currentRoute() {
  try {
    const pages = getCurrentPages()
    const page = pages[pages.length - 1]
    if (!page) return ''
    return `/${page.route || (page.$page && page.$page.route) || ''}`
  } catch (error) {
    return ''
  }
}

export function redirectToLogin(message = '') {
  if (redirecting) return false
  if (currentRoute() === LOGIN_PAGE) return false
  redirecting = true
  clearSession()
  if (message) uni.showToast({ title: message, icon: 'none', duration: 1800 })
  setTimeout(() => {
    uni.reLaunch({
      url: LOGIN_PAGE,
      complete: () => {
        redirecting = false
      }
    })
  }, message ? 400 : 0)
  return true
}

/** 页面 onLoad 里调用：未登录直接跳登录页并返回 false。 */
export function requireLogin() {
  if (isLoggedIn()) return true
  redirectToLogin()
  return false
}

/** 后台页面 onLoad 里调用：非管理员立刻挡回首页，不让后台内容留在屏幕上。 */
export function requireAdmin() {
  if (!requireLogin()) return false
  if (isAdmin()) return true
  uni.showToast({ title: '后台管理仅对厂级管理员开放', icon: 'none', duration: 2200 })
  uni.reLaunch({ url: HOME_PAGE })
  return false
}

// 任何请求被服务端判定为登录失效，统一回登录页。
onUnauthorized(data => {
  redirectToLogin((data && data.message) || '登录已过期，请重新登录')
})
