<template>
  <view class="page-shell">
    <AppHeader title="我的" subtitle="账号、身份与数据" />
    <view class="page-body page-body--tabbed">
      <view class="identity-panel">
        <view class="identity-panel__avatar">{{ avatarText }}</view>
        <view class="identity-panel__copy">
          <text class="identity-panel__name">{{ user.name || '未登录' }}</text>
          <text class="identity-panel__meta">工号 {{ user.workNo }}{{ user.team ? ` · ${user.team}` : '' }}</text>
          <view class="identity-panel__tags">
            <text>{{ user.role || '员工' }}</text>
            <text v-if="user.scope">管辖：{{ user.scope }}</text>
          </view>
        </view>
        <view class="identity-panel__points">
          <text class="mono-number">{{ summary.monthPoints }}</text><text>本月积分</text>
        </view>
      </view>

      <view v-if="user.mustChangePassword" class="password-alert" @tap="openPassword">
        <AppIcon name="alert-triangle" :size="34" />
        <view class="password-alert__copy">
          <text class="password-alert__title">您还在使用初始密码</text>
          <text class="password-alert__text">为保证审核与积分记录可信，请尽快修改密码。</text>
        </view>
        <AppIcon name="chevron-right" :size="32" />
      </view>

      <view class="section-block">
        <view class="section-heading">
          <view><text class="section-title">工作入口</text><text class="section-subtitle">入口与数据范围由当前账号权限确定</text></view>
        </view>
        <view class="menu-list surface">
          <button v-for="(item, index) in workMenu" :key="item.title" class="menu-row" :class="{ 'menu-row--border': index > 0 }" @tap="go(item.url)">
            <view class="menu-row__icon"><AppIcon :name="item.icon" :size="38" /></view>
            <view class="menu-row__copy"><text class="menu-row__title">{{ item.title }}</text><text class="menu-row__text">{{ item.text }}</text></view>
            <AppIcon name="chevron-right" :size="34" tone="muted" />
          </button>
        </view>
      </view>

      <view class="section-block">
        <view class="section-heading"><view><text class="section-title">账号安全</text></view></view>
        <view class="menu-list surface">
          <button class="menu-row" @tap="openPassword">
            <view class="menu-row__icon"><AppIcon name="shield-lock" :size="38" /></view>
            <view class="menu-row__copy"><text class="menu-row__title">修改密码</text><text class="menu-row__text">修改后其它设备需要重新登录</text></view>
            <AppIcon name="chevron-right" :size="34" tone="muted" />
          </button>
          <button class="menu-row menu-row--border" @tap="confirmLogout">
            <view class="menu-row__icon"><AppIcon name="circle-x" :size="38" /></view>
            <view class="menu-row__copy"><text class="menu-row__title">退出登录</text><text class="menu-row__text">退出后需重新输入工号和密码</text></view>
            <AppIcon name="chevron-right" :size="34" tone="muted" />
          </button>
        </view>
      </view>

      <view class="section-block">
        <view class="section-heading"><view><text class="section-title">数据与隐私</text></view></view>
        <view class="data-note surface">
          <view class="data-note__head"><AppIcon name="info-circle" :size="38" /><text>数据与同步说明</text></view>
          <text class="data-note__text">人员、工号、工段和班组来自已导入的组织花名册；改善案例与照片来自提案材料。新增提案、审核、管理配置、积分和评优记录均通过服务器在三端共享，操作会记录到当前登录账号名下。</text>
        </view>
      </view>

      <button class="reset-button" @tap="resetCache">清除本机缓存并重新同步</button>
      <text class="product-note">热创星 · 全员持续改善平台</text>
    </view>

    <view v-if="passwordOpen" class="sheet-mask" @tap="closePassword">
      <view class="sheet" @tap.stop>
        <view class="sheet__head">
          <text class="sheet__title">修改密码</text>
          <button class="sheet__close" aria-label="关闭" @tap="closePassword"><AppIcon name="x" :size="32" tone="muted" /></button>
        </view>

        <view class="field-group">
          <text class="field-label">当前密码</text>
          <input class="input-control" :password="true" type="text" placeholder="请输入当前密码" placeholder-class="placeholder" :value="form.old" @input="form.old = $event.detail.value" />
        </view>
        <view class="field-group">
          <text class="field-label">新密码</text>
          <input class="input-control" :password="true" type="text" placeholder="至少 6 位" placeholder-class="placeholder" :value="form.next" @input="form.next = $event.detail.value" />
        </view>
        <view class="field-group">
          <text class="field-label">确认新密码</text>
          <input class="input-control" :password="true" type="text" placeholder="再输入一次" placeholder-class="placeholder" :value="form.confirm" @input="form.confirm = $event.detail.value" />
        </view>

        <view v-if="error" class="sheet__error"><AppIcon name="alert-triangle" :size="30" /><text>{{ error }}</text></view>

        <view class="button-row">
          <button class="btn btn--secondary btn--block" :disabled="saving" @tap="closePassword">取消</button>
          <button class="btn btn--primary btn--block" :disabled="saving" @tap="savePassword">{{ saving ? '保存中…' : '保存' }}</button>
        </view>
      </view>
    </view>

    <AppTabbar current="profile" />
  </view>
</template>

<script>
import AppHeader from '../../components/AppHeader.vue'
import AppIcon from '../../components/AppIcon.vue'
import AppTabbar from '../../components/AppTabbar.vue'
import { ensureSynchronized } from '../../utils/api.js'
import { currentUser, changePassword, logout, refreshUser, openAdminPage } from '../../utils/session.js'
import { personalSummary } from '../../utils/stats.js'

export default {
  components: { AppHeader, AppIcon, AppTabbar },
  data() {
    return {
      user: currentUser() || {},
      summary: { monthPoints: 0 },
      passwordOpen: false,
      saving: false,
      error: '',
      form: { old: '', next: '', confirm: '' }
    }
  },
  computed: {
    avatarText() {
      return (this.user.name || '').slice(0, 1) || '厂'
    },
    workMenu() {
      const menu = [
        { title: '我的提案', text: '查看状态、修改驳回内容', icon: 'list-details', url: '/pages/proposal/list' }
      ]
      if (this.user.reviewLevel || this.user.canRecommend) {
        menu.push({ title: '审核工作台', text: '按层级查看管辖范围待办', icon: 'clipboard-check', url: '/pages/review/list' })
      }
      menu.push({ title: '积分与季度评优', text: '积分明细、候选和荣誉归档', icon: 'trophy', url: '/pages/points/index' })
        menu.push({ title: '提案导出', text: '导出 Excel 台账或固定 Word、PPT 模板', icon: 'download', url: '/pages/admin/export' })
      if (this.user.isAdmin) {
        menu.push({ title: '后台管理', text: '人员、权限、组织和规则配置', icon: 'settings', url: '/pages/admin/index' })
        menu.push({ title: '登录账号', text: '查看登录状态、重置员工密码', icon: 'user-circle', url: '/pages/admin/accounts' })
        menu.push({ title: '公告通知', text: '发布并维护厂级消息', icon: 'speakerphone', url: '/pages/admin/notices' })
      }
      return menu
    }
  },
  async onShow() {
    await ensureSynchronized()
    await refreshUser()
    this.user = currentUser() || {}
    this.summary = personalSummary(this.user)
  },
  methods: {
    go(url) {
      // 全员入口留在当前域名，管理功能进入后台域名。
      if (url.startsWith('/pages/admin/') && !['/pages/admin/notices', '/pages/admin/export'].includes(url)) openAdminPage(url)
      else uni.navigateTo({ url })
    },
    openPassword() {
      this.form = { old: '', next: '', confirm: '' }
      this.error = ''
      this.passwordOpen = true
    },
    closePassword() {
      if (this.saving) return
      this.passwordOpen = false
    },
    async savePassword() {
      if (this.saving) return
      const next = String(this.form.next || '').trim()
      if (!this.form.old) {
        this.error = '请输入当前密码'
        return
      }
      if (next.length < 6) {
        this.error = '新密码至少 6 位'
        return
      }
      if (next !== String(this.form.confirm || '').trim()) {
        this.error = '两次输入的新密码不一致'
        return
      }
      this.saving = true
      this.error = ''
      try {
        await changePassword(this.form.old, next)
        this.user = currentUser() || {}
        this.passwordOpen = false
        uni.showToast({ title: '密码已更新', icon: 'success' })
      } catch (error) {
        this.error = error.message || '密码修改失败'
      } finally {
        this.saving = false
      }
    },
    confirmLogout() {
      uni.showModal({
        title: '退出登录',
        content: '退出后需要重新输入工号和密码。已提交到服务器的数据不会丢失。',
        confirmText: '退出登录',
        confirmColor: '#b93c28',
        success: result => {
          if (result.confirm) logout()
        }
      })
    },
    resetCache() {
      uni.showModal({
        title: '清除本机缓存',
        content: '未提交的本机草稿会被清除，已提交到服务器的数据不会删除。随后将重新拉取最新数据。',
        confirmText: '清除并同步',
        confirmColor: '#b93c28',
        success: async result => {
          if (!result.confirm) return
          // 只清业务缓存，登录状态保留。
          const token = uni.getStorageSync('heatstar_token')
          const user = uni.getStorageSync('heatstar_user')
          uni.clearStorageSync()
          uni.setStorageSync('heatstar_schema_version', '1.0.0')
          if (token) uni.setStorageSync('heatstar_token', token)
          if (user) uni.setStorageSync('heatstar_user', user)
          await ensureSynchronized(true)
          this.summary = personalSummary(currentUser() || {})
          uni.showToast({ title: '已重新同步', icon: 'success' })
        }
      })
    }
  }
}
</script>

<style scoped>
.identity-panel { display: grid; grid-template-columns: 92rpx minmax(0,1fr) auto; align-items: center; gap: 20rpx; padding: 28rpx; border-radius: 26rpx; background: #26313a; color: #f8f7f2; }
.identity-panel__avatar { display: flex; width: 92rpx; height: 92rpx; align-items: center; justify-content: center; border: 1rpx solid rgba(255,255,255,.22); border-radius: 50%; background: #b93c28; font-size: 36rpx; font-weight: 800; }
.identity-panel__copy { min-width: 0; }
.identity-panel__name { display: block; font-size: 34rpx; font-weight: 800; }
.identity-panel__meta { display: block; margin-top: 7rpx; color: rgba(248,247,242,.68); font-size: 22rpx; }
.identity-panel__tags { display: flex; flex-wrap: wrap; gap: 10rpx; margin-top: 14rpx; }
.identity-panel__tags text { padding: 5rpx 12rpx; border-radius: 999rpx; background: rgba(255,255,255,.1); font-size: 19rpx; }
.identity-panel__points { display: flex; flex-direction: column; align-items: flex-end; }
.identity-panel__points text:first-child { font-size: 42rpx; font-weight: 800; }
.identity-panel__points text:last-child { color: rgba(248,247,242,.65); font-size: 19rpx; }
.password-alert { display: flex; width: 100%; align-items: center; gap: 14rpx; margin-top: 22rpx; padding: 22rpx; border: 1rpx solid #dba49b; border-radius: 20rpx; background: #fff5f2; color: #a83222; text-align: left; }
.password-alert__copy { min-width: 0; flex: 1; }
.password-alert__title { display: block; font-size: 26rpx; font-weight: 750; }
.password-alert__text { display: block; margin-top: 5rpx; color: #9a5346; font-size: 21rpx; line-height: 1.5; }
.menu-list { overflow: hidden; }
.menu-row { display: grid; width: 100%; grid-template-columns: 66rpx minmax(0,1fr) 34rpx; align-items: center; gap: 16rpx; padding: 22rpx; text-align: left; }
.menu-row--border { border-top: 1rpx solid #e2e1dc; }
.menu-row__icon { display: flex; width: 66rpx; height: 66rpx; align-items: center; justify-content: center; border-radius: 18rpx; background: #ecebe6; }
.menu-row__title, .menu-row__text { display: block; }
.menu-row__title { font-size: 27rpx; font-weight: 700; }
.menu-row__text { margin-top: 5rpx; color: #777d81; font-size: 21rpx; }
.data-note { padding: 24rpx; }
.data-note__head { display: flex; align-items: center; gap: 12rpx; font-size: 27rpx; font-weight: 700; }
.data-note__text { display: block; margin-top: 16rpx; color: #686e72; font-size: 23rpx; line-height: 1.7; }
.reset-button { display: flex; width: 100%; min-height: 88rpx; align-items: center; justify-content: center; margin-top: 34rpx; border: 1rpx solid #d4aaa3; border-radius: 16rpx; background: #fbfaf7; color: #9f3021; font-size: 26rpx; font-weight: 700; }
.product-note { display: block; margin: 26rpx 0 4rpx; color: #94989a; font-size: 21rpx; text-align: center; }
.sheet-mask { position: fixed; z-index: 60; top: 0; right: 0; bottom: 0; left: 0; display: flex; align-items: flex-end; justify-content: center; background: rgba(24,28,32,.52); }
.sheet { width: 100%; max-width: 560px; padding: 30rpx 28rpx calc(34rpx + env(safe-area-inset-bottom)); border-radius: 28rpx 28rpx 0 0; background: #fbfaf7; }
.sheet__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24rpx; }
.sheet__title { font-size: 32rpx; font-weight: 750; }
.sheet__close { display: flex; width: 60rpx; height: 60rpx; align-items: center; justify-content: center; border-radius: 50%; }
.sheet__error { display: flex; align-items: center; gap: 10rpx; margin-bottom: 20rpx; padding: 16rpx 18rpx; border: 1rpx solid #dba49b; border-radius: 14rpx; background: #fff5f2; color: #a83222; font-size: 23rpx; }
</style>
