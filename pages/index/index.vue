<template>
  <view class="page-shell">
    <AppHeader title="热创星" subtitle="全员持续改善平台" action-icon="bell" action-label="公告通知" :badge="noticeBadge" @action="go('/pages/admin/notices')" />

    <view class="page-body page-body--tabbed">
      <view class="hero">
        <image class="hero__image" src="/static/images/workshop-banner.jpg" mode="aspectFill" />
        <view class="hero__scrim" />
        <view class="hero__copy">
          <text class="hero__eyebrow">持续改善 · 全员参与</text>
          <text class="hero__title">让每一次改变，都成为可见的价值</text>
          <view class="hero__deadline">
            <AppIcon name="calendar" :size="30" tone="inverse" />
            <text>{{ cutoffLabel }}</text>
          </view>
        </view>
      </view>

      <view class="welcome-row">
        <view>
          <text class="welcome-row__greeting">{{ user.name }}，{{ greetingText }}</text>
          <text class="welcome-row__scope">{{ scopeText }}</text>
        </view>
        <view class="avatar">{{ avatarText }}</view>
      </view>

      <view class="work-summary surface">
        <view class="summary-item">
          <text class="summary-item__value mono-number">{{ summary.monthPoints }}</text>
          <text class="summary-item__label">本月积分</text>
        </view>
        <view class="summary-separator" />
        <view class="summary-item">
          <text class="summary-item__value mono-number">{{ summary.processing }}</text>
          <text class="summary-item__label">处理中</text>
        </view>
        <view class="summary-separator" />
        <view class="summary-item">
          <text class="summary-item__value mono-number">{{ rankText }}</text>
          <text class="summary-item__label">月度排名</text>
        </view>
      </view>

      <button class="submit-entry" @tap="go('/pages/proposal/type')">
        <view class="submit-entry__icon"><AppIcon name="file-plus" :size="48" tone="inverse" /></view>
        <view class="submit-entry__copy">
          <text class="submit-entry__title">发起改善提案</text>
          <text class="submit-entry__text">精益、六源、工具开发或 OPL，选择门类后填写</text>
        </view>
        <AppIcon name="chevron-right" :size="40" tone="inverse" />
      </button>

      <view class="quick-actions">
        <button v-for="item in quickActions" :key="item.title" class="quick-action" :class="item.className" @tap="go(item.url)">
          <view class="quick-action__icon"><AppIcon :name="item.icon" :size="42" /></view>
          <text class="quick-action__title">{{ item.title }}</text>
          <text class="quick-action__meta">{{ item.meta }}</text>
        </button>
      </view>

      <view v-if="topNotice" class="notice-strip" @tap="go('/pages/admin/notices')">
        <view class="notice-strip__icon"><AppIcon name="speakerphone" :size="36" /></view>
        <view class="notice-strip__copy">
          <text class="notice-strip__title">{{ topNotice.title }}</text>
          <text class="notice-strip__text">{{ topNotice.summary }}</text>
        </view>
        <AppIcon name="chevron-right" :size="34" tone="muted" />
      </view>

      <view class="section-block">
        <view class="section-heading">
          <view>
            <text class="section-title">最近提案</text>
            <text class="section-subtitle">状态、星级与积分实时留痕</text>
          </view>
          <button class="link-text" @tap="go('/pages/proposal/list')">查看全部</button>
        </view>

        <view class="proposal-list surface">
          <button v-for="(item, index) in recentProposals" :key="item.id" class="proposal-row" :class="{ 'proposal-row--border': index > 0 }" @tap="openProposal(item.id)">
            <image class="proposal-row__thumb" :src="thumbOf(item)" mode="aspectFill" />
            <view class="proposal-row__content">
              <view class="proposal-row__meta">
                <text class="type-label" :class="`type-label--${item.type}`">{{ item.typeText }}</text>
                <StatusTag :label="item.statusText" :status="item.status" />
              </view>
              <text class="proposal-row__title">{{ item.title }}</text>
              <view class="proposal-row__footer">
                <text>{{ item.team }}</text>
                <text v-if="item.stars" class="star-text">{{ '★'.repeat(item.stars) }} · {{ item.points }} 分</text>
                <text v-else>{{ String(item.submittedAt || '').slice(5, 10) }}</text>
              </view>
            </view>
            <AppIcon name="chevron-right" :size="32" tone="muted" />
          </button>
        </view>
      </view>
    </view>

    <AppTabbar current="home" />
  </view>
</template>

<script>
import AppHeader from '../../components/AppHeader.vue'
import AppIcon from '../../components/AppIcon.vue'
import AppTabbar from '../../components/AppTabbar.vue'
import StatusTag from '../../components/StatusTag.vue'
import { getProposals, readStorage, STORAGE_KEYS } from '../../utils/storage.js'
import { ensureSynchronized } from '../../utils/api.js'
import { currentUser, openAdminPage } from '../../utils/session.js'

import { personalSummary, reviewPendingCount, noticeCount, candidateCount, greeting, cutoffText, activeRules } from '../../utils/stats.js'

export default {
  components: { AppHeader, AppIcon, AppTabbar, StatusTag },
  data() {
    return {
      user: currentUser() || {},
      recentProposals: [],
      summary: { monthPoints: 0, processing: 0, rank: 0, rankTotal: 0, mineCount: 0 },
      pendingReviews: 0,
      candidates: 0,
      noticeBadge: '',
      topNotice: null,
      cutoffLabel: cutoffText(),
      greetingText: greeting()
    }
  },
  computed: {
    avatarText() {
      return (this.user.name || '').slice(0, 1) || '厂'
    },
    scopeText() {
      return [this.user.section, this.user.team, this.user.role].filter(Boolean).join(' · ')
    },
    rankText() {
      if (!this.summary.rank) return '—'
      return String(this.summary.rank).padStart(2, '0')
    },
    // 入口按当前账号的权限显示，员工看不到审核台和后台。
    quickActions() {
      const actions = [
        { title: '我的提案', meta: `${this.summary.mineCount} 条记录`, icon: 'list-details', url: '/pages/proposal/list', className: 'quick-action--paper' }
      ]
      if (this.user.reviewLevel || this.user.canRecommend) {
        actions.push({ title: '审核工作台', meta: `${this.pendingReviews} 条待办`, icon: 'clipboard-check', url: '/pages/review/list', className: 'quick-action--blue' })
      }
      actions.push({ title: '积分与评优', meta: this.candidates ? `季度候选 ${this.candidates} 人` : '积分明细与评优', icon: 'trophy', url: '/pages/points/index', className: 'quick-action--amber' })
      if (this.user.isAdmin) {
        actions.push({ title: '后台管理', meta: '人员 · 权限 · 规则', icon: 'settings', url: '/pages/admin/index', className: 'quick-action--gray' })
      }
      return actions
    }
  },
  async onShow() {
    await ensureSynchronized()
    this.user = currentUser() || {}
    this.greetingText = greeting()
    this.cutoffLabel = cutoffText(activeRules())

    const proposals = getProposals()
    this.recentProposals = proposals.slice(0, 3)
    this.summary = personalSummary(this.user, { proposals })
    this.pendingReviews = reviewPendingCount(this.user, proposals)
    this.candidates = candidateCount()

    const count = noticeCount()
    this.noticeBadge = count ? String(count) : ''
    const notices = readStorage(STORAGE_KEYS.notices, []) || []
    const published = notices.filter(item => !item.status || item.status === '已发布')
    this.topNotice = published.find(item => item.top) || published[0] || null
  },
  methods: {
    go(url) {
      // 公告全员可看，留在当前域名；其余后台页交给后台域名。
      if (url.startsWith('/pages/admin/') && url !== '/pages/admin/notices') openAdminPage(url)
      else uni.navigateTo({ url })
    },
    openProposal(id) { uni.navigateTo({ url: `/pages/proposal/detail?id=${encodeURIComponent(id)}` }) },
    thumbOf(item) {
      const photos = Array.isArray(item.afterPhotos) ? item.afterPhotos : []
      return photos[0] || '/static/images/workshop-banner.jpg'
    }
  }
}
</script>

<style scoped>
.hero { position: relative; overflow: hidden; height: 330rpx; border-radius: 28rpx; background: #30383e; }
.hero__image, .hero__scrim { position: absolute; inset: 0; width: 100%; height: 100%; }
.hero__scrim { background: linear-gradient(90deg, rgba(22,27,31,.9) 0%, rgba(22,27,31,.58) 58%, rgba(22,27,31,.08) 100%); }
.hero__copy { position: absolute; top: 0; right: 0; bottom: 0; left: 0; display: flex; flex-direction: column; justify-content: flex-end; padding: 32rpx; color: #fffaf4; }
.hero__eyebrow { margin-bottom: 12rpx; font-size: 21rpx; font-weight: 700; letter-spacing: 2rpx; }
.hero__title { max-width: 500rpx; font-size: 39rpx; font-weight: 800; line-height: 1.3; }
.hero__deadline { display: flex; align-items: center; gap: 9rpx; margin-top: 22rpx; font-size: 23rpx; }
.welcome-row { display: flex; align-items: center; justify-content: space-between; margin: 30rpx 4rpx 20rpx; }
.welcome-row__greeting { display: block; font-size: 33rpx; font-weight: 750; }
.welcome-row__scope { display: block; margin-top: 8rpx; color: #71777b; font-size: 23rpx; }
.avatar { display: flex; width: 70rpx; height: 70rpx; align-items: center; justify-content: center; border: 1rpx solid #d9c4bd; border-radius: 50%; background: #f4e2dc; color: #9c3021; font-size: 28rpx; font-weight: 800; }
.work-summary { display: grid; grid-template-columns: 1fr 1rpx 1fr 1rpx 1fr; align-items: center; padding: 24rpx 12rpx; }
.summary-item { display: flex; flex-direction: column; align-items: center; }
.summary-item__value { color: #26313a; font-size: 38rpx; font-weight: 800; }
.summary-item__label { margin-top: 4rpx; color: #757b7f; font-size: 21rpx; }
.summary-separator { width: 1rpx; height: 52rpx; background: #dfded8; }
.submit-entry { display: flex; width: 100%; min-height: 128rpx; align-items: center; gap: 20rpx; margin-top: 22rpx; padding: 0 26rpx; border-radius: 24rpx; background: #b93c28; color: #fffaf4; text-align: left; }
.submit-entry__icon { display: flex; width: 70rpx; height: 70rpx; align-items: center; justify-content: center; border-radius: 18rpx; background: rgba(255,255,255,.13); }
.submit-entry__copy { min-width: 0; flex: 1; }
.submit-entry__title { display: block; font-size: 31rpx; font-weight: 800; }
.submit-entry__text { display: block; margin-top: 7rpx; color: rgba(255,250,244,.78); font-size: 21rpx; }
.quick-actions { display: grid; grid-template-columns: 1.08fr .92fr; gap: 16rpx; margin-top: 16rpx; }
.quick-action { min-height: 194rpx; padding: 24rpx; border: 1rpx solid #d9d8d2; border-radius: 22rpx; text-align: left; }
.quick-action--paper { background: #fbfaf7; }
.quick-action--blue { background: #e7eef1; }
.quick-action--amber { background: #f2eadb; }
.quick-action--gray { background: #e9e9e5; }
.quick-action__icon { display: flex; width: 60rpx; height: 60rpx; align-items: center; justify-content: center; border-radius: 16rpx; background: rgba(255,255,255,.55); }
.quick-action__title { display: block; margin-top: 18rpx; font-size: 27rpx; font-weight: 750; }
.quick-action__meta { display: block; margin-top: 6rpx; color: #73797d; font-size: 21rpx; }
.notice-strip { display: flex; align-items: center; gap: 16rpx; margin-top: 18rpx; padding: 20rpx 22rpx; border: 1rpx solid #ded5c5; border-radius: 20rpx; background: #fbf3e5; }
.notice-strip__icon { display: flex; width: 58rpx; height: 58rpx; align-items: center; justify-content: center; border-radius: 50%; background: #ead8b9; }
.notice-strip__copy { min-width: 0; flex: 1; }
.notice-strip__title, .notice-strip__text { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.notice-strip__title { font-size: 25rpx; font-weight: 750; }
.notice-strip__text { margin-top: 5rpx; color: #786f62; font-size: 21rpx; }
.proposal-list { overflow: hidden; }
.proposal-row { display: grid; width: 100%; grid-template-columns: 112rpx minmax(0,1fr) 32rpx; align-items: center; gap: 18rpx; padding: 20rpx; text-align: left; }
.proposal-row--border { border-top: 1rpx solid #e2e1dc; }
.proposal-row__thumb { width: 112rpx; height: 112rpx; border-radius: 16rpx; background: #e6e5df; }
.proposal-row__content { min-width: 0; }
.proposal-row__meta { display: flex; align-items: center; gap: 10rpx; }
.type-label { font-size: 21rpx; font-weight: 700; }
.type-label--lean { color: #375f76; }
.type-label--six { color: #9c3b2b; }
.type-label--tool { color: #385e78; }
.type-label--opl { color: #67517d; }
.proposal-row__title { display: -webkit-box; overflow: hidden; margin-top: 10rpx; font-size: 26rpx; font-weight: 700; line-height: 1.4; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.proposal-row__footer { display: flex; justify-content: space-between; gap: 12rpx; margin-top: 11rpx; color: #7a8084; font-size: 21rpx; }
.star-text { color: #a66e17; font-weight: 700; }
</style>
