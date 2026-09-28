/**
 * 全局页面门禁。
 *
 * 用 app.mixin 挂在页面生命周期上，避免在 21 个页面里各写一遍登录判断：
 * 登录页放行，后台页要管理员，其余页面要登录。
 */
import { LOGIN_PAGE, requireLogin, requireAdmin, isLoggedIn, refreshUser } from './session.js'

const PUBLIC_ROUTES = [LOGIN_PAGE]
// 公告与提案导出全员可访问；公告编辑仍由页面和服务端校验管理员权限。
const LOGIN_ONLY_ADMIN_ROUTES = ['/pages/admin/notices', '/pages/admin/export']

function routeOf(vm) {
  const direct = vm && (vm.route || (vm.$page && vm.$page.route))
  if (direct) return `/${String(direct).replace(/^\//, '')}`
  try {
    const pages = getCurrentPages()
    const page = pages[pages.length - 1]
    const route = page && (page.route || (page.$page && page.$page.route))
    return route ? `/${String(route).replace(/^\//, '')}` : ''
  } catch (error) {
    return ''
  }
}

function check(vm) {
  const route = routeOf(vm)
  if (!route || PUBLIC_ROUTES.includes(route)) return true
  if (LOGIN_ONLY_ADMIN_ROUTES.includes(route)) return requireLogin()
  if (route.startsWith('/pages/admin/')) return requireAdmin()
  return requireLogin()
}

export const authGuard = {
  onLoad() {
    check(this)
  },
  onShow() {
    const route = routeOf(this)
    if (!route || PUBLIC_ROUTES.includes(route)) return
    if (!check(this)) return
    // 人员名单或角色被后台改过时，回到前台就刷新一次身份。
    if (isLoggedIn()) refreshUser()
  }
}

export function installAuthGuard(app) {
  app.mixin(authGuard)
  return app
}
