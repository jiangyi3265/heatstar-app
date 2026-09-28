<script>
import { ensureSynchronized } from './utils/api.js'
import { isLoggedIn, isAdmin, redirectToLogin, refreshUser } from './utils/session.js'

export default {
  async onLaunch() {
    const version = uni.getStorageSync('heatstar_schema_version')
    if (version !== '1.0.0') {
      uni.setStorageSync('heatstar_schema_version', '1.0.0')
    }

    // 没登录就别拉数据了，直接进登录页。
    if (!isLoggedIn()) {
      redirectToLogin()
      return
    }

    await ensureSynchronized(true)
    await refreshUser()

    // #ifdef H5
    if (typeof window !== 'undefined') {
      const adminHost = window.location.hostname.toLowerCase().startsWith('gyht.')
      const localHost = ['localhost', '127.0.0.1'].includes(window.location.hostname)
      const hash = window.location.hash || ''
      const atLanding = !hash || hash === '#/' || hash.includes('/pages/index/index')
      const onAdminPage = hash.includes('/pages/admin/')
      const onExportPage = /^#\/pages\/admin\/export(?:[?]|$)/.test(hash)
      if (adminHost && atLanding && isAdmin()) window.location.replace('/#/pages/admin/index')
      if (!localHost && !adminHost && onAdminPage && !onExportPage) window.location.replace('/#/pages/index/index')
    }
    // #endif
  },
  onShow() {
    if (isLoggedIn()) ensureSynchronized()
  }
}
</script>

<style>
page {
  min-height: 100%;
  background: #f3f2ee;
  color: #20262d;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 28rpx;
}

view, text, image, button, input, textarea, picker, scroll-view {
  box-sizing: border-box;
}

button {
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  line-height: 1.4;
}

button::after { border: 0; }

.page-shell {
  min-height: 100vh;
  background: #f3f2ee;
}

.page-body {
  padding: 24rpx 28rpx calc(56rpx + env(safe-area-inset-bottom));
}

.page-body--tabbed {
  padding-bottom: calc(176rpx + env(safe-area-inset-bottom));
}

.surface {
  background: #fbfaf7;
  border: 1rpx solid #deddd7;
  border-radius: 24rpx;
}

.section-block {
  margin-top: 32rpx;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 18rpx;
}

.section-title {
  color: #20262d;
  font-size: 32rpx;
  font-weight: 700;
  line-height: 1.25;
}

.section-subtitle {
  margin-top: 6rpx;
  color: #747a7f;
  font-size: 23rpx;
  line-height: 1.5;
}

.link-text {
  color: #b93c28;
  font-size: 25rpx;
  font-weight: 600;
}

.field-group {
  margin-bottom: 26rpx;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 6rpx;
  margin-bottom: 12rpx;
  color: #363c42;
  font-size: 25rpx;
  font-weight: 600;
}

.field-required { color: #c43d2b; }
.field-hint { margin-top: 9rpx; color: #858a8e; font-size: 22rpx; line-height: 1.45; }

.input-control,
.textarea-control,
.picker-control {
  width: 100%;
  min-height: 88rpx;
  padding: 0 24rpx;
  border: 1rpx solid #d6d5cf;
  border-radius: 16rpx;
  background: #fdfcf9;
  color: #20262d;
  font-size: 28rpx;
}

.input-control:focus,
.textarea-control:focus {
  border-color: #b93c28;
}

.textarea-control {
  min-height: 190rpx;
  padding-top: 22rpx;
  padding-bottom: 22rpx;
  line-height: 1.65;
}

.picker-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.placeholder { color: #a1a4a6; }

.button-row {
  display: flex;
  gap: 18rpx;
}

.btn {
  display: flex;
  min-height: 88rpx;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  padding: 0 28rpx;
  border-radius: 16rpx;
  font-size: 28rpx;
  font-weight: 700;
  transition: opacity 180ms ease-out, transform 180ms ease-out;
}

.btn:active { opacity: .82; transform: scale(.985); }
.btn[disabled] { opacity: .45; }
.btn--primary { background: #b93c28; color: #fffaf4; }
.btn--dark { background: #26313a; color: #f8f7f2; }
.btn--secondary { border: 1rpx solid #c9c8c2; background: #fbfaf7; color: #30373d; }
.btn--danger { border: 1rpx solid #dba49b; background: #fff5f2; color: #a83222; }
.btn--block { width: 100%; }
.btn--small { min-height: 68rpx; padding: 0 22rpx; font-size: 24rpx; border-radius: 14rpx; }

.divider { height: 1rpx; background: #e2e1dc; }

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.chip {
  display: inline-flex;
  min-height: 60rpx;
  align-items: center;
  justify-content: center;
  padding: 0 22rpx;
  border: 1rpx solid #d8d7d1;
  border-radius: 999rpx;
  background: #f9f8f4;
  color: #646a6f;
  font-size: 24rpx;
  font-weight: 600;
}

.chip--active { border-color: #b93c28; background: #f8e7e2; color: #9f2e1f; }

.empty-state {
  padding: 72rpx 36rpx;
  text-align: center;
  color: #7c8286;
}

.empty-state__title { margin-top: 18rpx; color: #30373d; font-size: 28rpx; font-weight: 700; }
.empty-state__text { margin-top: 8rpx; font-size: 23rpx; line-height: 1.55; }

.mono-number {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
}

.sticky-actions {
  position: fixed;
  z-index: 20;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  gap: 16rpx;
  padding: 18rpx 28rpx calc(18rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #deddd7;
  background: rgba(251, 250, 247, .98);
}

.sticky-actions .btn { flex: 1; }

.two-column {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.text-success { color: #287253; }
.text-warning { color: #9f6a1f; }
.text-danger { color: #aa3424; }
.text-muted { color: #7a8084; }

/*
 * 后台管理主要在电脑上使用。rpx 在 H5 下固定按手机基准渲染（1rpx = .5px），
 * 宽屏上会变成「字很小 + 横向拉满整屏」，所以这里为 .page-shell.admin-shell 单独限宽居中，
 * 并把正文、控件和点击目标放大一档。员工端保持手机布局不受影响。
 */
@media (min-width: 860px) {
  .page-shell.admin-shell .page-body {
    box-sizing: border-box;
    max-width: 1140px;
    margin: 0 auto;
    padding: 30px 36px 80px;
  }

  .page-shell.admin-shell .header-bar {
    box-sizing: border-box;
    max-width: 1140px;
    margin: 0 auto;
    min-height: 64px;
    padding: 0 36px;
  }
  .page-shell.admin-shell .header-title { font-size: 19px; }
  .page-shell.admin-shell .header-subtitle { font-size: 13px; margin-top: 3px; }

  .page-shell.admin-shell .section-block { margin-top: 30px; }
  .page-shell.admin-shell .section-title { font-size: 20px; }
  .page-shell.admin-shell .section-subtitle { font-size: 13px; margin-top: 4px; }
  .page-shell.admin-shell .section-heading { margin-bottom: 14px; }
  .page-shell.admin-shell .surface { border-radius: 14px; }

  .page-shell.admin-shell .field-group { margin-bottom: 20px; }
  .page-shell.admin-shell .field-label { font-size: 14px; margin-bottom: 7px; }
  .page-shell.admin-shell .field-hint { font-size: 12px; }
  .page-shell.admin-shell .input-control,
  .page-shell.admin-shell .picker-control { min-height: 44px; padding: 0 14px; border-radius: 9px; font-size: 15px; }
  .page-shell.admin-shell .textarea-control { min-height: 120px; padding: 12px 14px; border-radius: 9px; font-size: 15px; }

  .page-shell.admin-shell .btn { min-height: 44px; padding: 0 20px; border-radius: 9px; font-size: 15px; }
  .page-shell.admin-shell .btn--small { min-height: 36px; padding: 0 14px; border-radius: 8px; font-size: 13px; }
  .page-shell.admin-shell .chip { min-height: 34px; padding: 0 14px; font-size: 13px; }
  .page-shell.admin-shell .link-text { font-size: 14px; }

  .page-shell.admin-shell .empty-state { padding: 56px 32px; }
  .page-shell.admin-shell .empty-state__title { font-size: 16px; }
  .page-shell.admin-shell .empty-state__text { font-size: 13px; }

  .page-shell.admin-shell .sticky-actions {
    box-sizing: border-box;
    max-width: 1140px;
    right: 0;
    left: 0;
    margin: 0 auto;
    padding: 12px 36px;
    border-left: 1rpx solid #deddd7;
    border-right: 1rpx solid #deddd7;
  }
  .page-shell.admin-shell .two-column { gap: 18px; }
}
</style>
