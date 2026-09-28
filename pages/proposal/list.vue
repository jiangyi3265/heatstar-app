<template>
  <view class="page-shell">
    <AppHeader
      title="我的提案"
      :subtitle="[user.team, user.name].filter(Boolean).join(' · ')"
      action-icon="plus"
      action-label="新建提案"
      @action="createProposal"
    />

    <view class="page-body page-body--tabbed list-page">
      <view class="overview-strip">
        <view class="overview-strip__copy">
          <text class="overview-strip__eyebrow">改善记录</text>
          <text class="overview-strip__title">{{ mine.length }} 项提案正在持续创造价值</text>
          <text class="overview-strip__caption">已采纳 {{ approvedCount }} 项，累计获得 {{ approvedPoints }} 积分</text>
        </view>
        <button class="btn btn--primary btn--small" @tap="createProposal">
          <AppIcon name="file-plus" :size="30" tone="inverse" />
          <text>新提案</text>
        </button>
      </view>

      <view class="search-row">
        <view class="search-control">
          <AppIcon name="search" :size="34" tone="muted" />
          <input v-model.trim="keyword" placeholder="搜索名称或编号" confirm-type="search" />
          <button v-if="keyword" aria-label="清除搜索" @tap="keyword = ''">
            <AppIcon name="circle-x" :size="30" tone="muted" />
          </button>
        </view>
      </view>

      <scroll-view class="filter-scroll" scroll-x :show-scrollbar="false">
        <view class="filter-row">
          <button
            v-for="item in statusOptions"
            :key="item.value"
            class="filter-chip"
            :class="{ 'filter-chip--active': activeStatus === item.value }"
            @tap="activeStatus = item.value"
          >
            <text>{{ item.label }}</text>
            <text class="filter-chip__count">{{ countFor(item.value) }}</text>
          </button>
        </view>
      </scroll-view>

      <view v-if="filtered.length" class="proposal-list">
        <view
          v-for="proposal in filtered"
          :key="proposal.id"
          class="proposal-card surface"
          hover-class="proposal-card--pressed"
          @tap="openDetail(proposal.id)"
        >
          <view class="proposal-card__head">
            <view class="proposal-type" :class="`proposal-type--${proposal.type}`">
              <AppIcon :name="typeIcon(proposal)" :size="27" />
              <text>{{ typeLabel(proposal) }}</text>
            </view>
            <StatusTag :label="proposal.statusText || statusLabel(proposal.status)" :status="proposal.status" />
          </view>

          <text class="proposal-card__title">{{ proposal.title }}</text>
          <text class="proposal-card__number mono-number">{{ proposal.sourceNo || proposal.id }}</text>

          <view class="evidence-pair" :class="{ 'evidence-pair--single': proposal.type === 'opl' }">
            <view class="evidence-thumb">
              <image :src="firstPhoto(proposal.beforePhotos)" mode="aspectFill" />
              <text>{{ evidenceLabels(proposal).before }}</text>
            </view>
            <view v-if="proposal.type !== 'opl'" class="evidence-arrow"><AppIcon name="chevron-right" :size="28" tone="muted" /></view>
            <view v-if="proposal.type !== 'opl'" class="evidence-thumb">
              <image :src="firstPhoto(proposal.afterPhotos)" mode="aspectFill" />
              <text>{{ evidenceLabels(proposal).after }}</text>
            </view>
          </view>

          <view class="proposal-card__meta">
            <view class="meta-line">
              <AppIcon name="users" :size="28" tone="muted" />
              <text>{{ proposal.team }}</text>
              <text class="meta-separator">·</text>
              <text>{{ formatDate(proposal.submittedAt) }}</text>
            </view>
            <view class="score-line">
              <view v-if="proposal.stars" class="star-group" :aria-label="`${proposal.stars} 星`">
                <AppIcon v-for="index in 3" :key="index" name="star" :size="27" :tone="index <= proposal.stars ? 'accent' : 'muted'" />
              </view>
              <text v-else class="score-pending">待评星</text>
              <text class="score-points" :class="{ 'score-points--active': proposal.points }">{{ proposal.points || 0 }} 积分</text>
            </view>
          </view>

          <view v-if="proposal.status === 'rejected'" class="reject-panel">
            <view class="reject-panel__copy">
              <text class="reject-panel__label">驳回原因</text>
              <text class="reject-panel__reason">{{ proposal.rejectReason || '请补充现场证据后重新提交。' }}</text>
            </view>
            <button class="btn btn--danger btn--small" @tap.stop="editRejected(proposal.id)">
              <AppIcon name="edit" :size="28" tone="accent" />
              <text>修改重提</text>
            </button>
          </view>
        </view>
      </view>

      <view v-else class="empty-state surface">
        <AppIcon name="clipboard-text" :size="72" tone="muted" />
        <text class="empty-state__title">{{ keyword ? '没有匹配的提案' : '这个状态下暂无提案' }}</text>
        <text class="empty-state__text">{{ keyword ? '请尝试搜索其他名称或编号。' : '完成一次现场改善后，从新建提案开始记录。' }}</text>
        <button v-if="activeStatus === 'all' && !keyword" class="btn btn--primary empty-state__action" @tap="createProposal">新建提案</button>
      </view>
    </view>

    <AppTabbar current="proposal" />
  </view>
</template>

<script>
import AppHeader from '../../components/AppHeader.vue'
import AppIcon from '../../components/AppIcon.vue'
import AppTabbar from '../../components/AppTabbar.vue'
import StatusTag from '../../components/StatusTag.vue'
import { currentUser } from '../../utils/session.js'
import { getProposals } from '../../utils/storage.js'
import { ensureSynchronized } from '../../utils/api.js'
import { isMine } from '../../utils/stats.js'
import { proposalTypeIcon, proposalTypeLabel } from '../../utils/proposal-types.js'

export default {
  components: { AppHeader, AppIcon, AppTabbar, StatusTag },
  data() {
    return {
      user: currentUser() || {},
      proposals: [],
      activeStatus: 'all',
      keyword: '',
      statusOptions: [
        { value: 'all', label: '全部' },
        { value: 'pending', label: '审核中' },
        { value: 'approved', label: '已采纳' },
        { value: 'rejected', label: '已驳回' }
      ]
    }
  },
  computed: {
    mine() {
      return this.proposals.filter(item => isMine(item, this.user))
    },
    approvedCount() {
      return this.mine.filter(item => item.status === 'approved').length
    },
    approvedPoints() {
      return this.mine.reduce((sum, item) => sum + Number(item.points || 0), 0)
    },
    filtered() {
      const query = this.keyword.toLowerCase()
      return this.mine.filter(item => {
        const statusMatch = this.matchesStatus(item, this.activeStatus)
        const text = `${item.title || ''} ${item.id || ''} ${item.sourceNo || ''}`.toLowerCase()
        return statusMatch && (!query || text.includes(query))
      })
    }
  },
  async onShow() {
    await ensureSynchronized()
    this.user = currentUser() || {}
    this.proposals = getProposals()
  },
  methods: {
    matchesStatus(item, status) {
      if (status === 'all') return true
      if (status === 'pending') return String(item.status).startsWith('pending')
      return item.status === status
    },
    countFor(status) {
      return this.mine.filter(item => this.matchesStatus(item, status)).length
    },
    typeLabel(item) {
      return proposalTypeLabel(item.type)
    },
    typeIcon(item) {
      return proposalTypeIcon(item.type)
    },
    evidenceLabels(item) {
      if (item.type === 'tool') return { before: '设计/开发', after: '成品/应用' }
      if (item.type === 'opl') return { before: '课程图片', after: '' }
      return { before: '改善前', after: '改善后' }
    },
    statusLabel(status) {
      const labels = {
        pending_team: '班组长审核',
        pending_review: '部门/制造厂小组评审',
        pending_company: '公司审核',
        pending_section: '部门小组待审（历史）',
        pending_factory: '部门小组待审（历史）',
        approved: '已采纳',
        rejected: '已驳回'
      }
      return labels[status] || '待处理'
    },
    firstPhoto(photos) {
      return Array.isArray(photos) && photos.length ? photos[0] : '/static/images/workshop-banner.jpg'
    },
    formatDate(value) {
      return String(value || '').slice(0, 10)
    },
    createProposal() {
      uni.navigateTo({ url: '/pages/proposal/type' })
    },
    openDetail(id) {
      uni.navigateTo({ url: `/pages/proposal/detail?id=${encodeURIComponent(id)}` })
    },
    editRejected(id) {
      uni.navigateTo({ url: `/pages/proposal/form?id=${encodeURIComponent(id)}` })
    }
  }
}
</script>

<style scoped>
.list-page { padding-top: 20rpx; }
.overview-strip { display: flex; align-items: center; gap: 24rpx; padding: 24rpx 4rpx 28rpx; }
.overview-strip__copy { min-width: 0; flex: 1; }
.overview-strip__eyebrow { display: block; color: #a43625; font-size: 21rpx; font-weight: 750; letter-spacing: 2rpx; }
.overview-strip__title { display: block; margin-top: 7rpx; color: #232a30; font-size: 31rpx; font-weight: 760; line-height: 1.35; }
.overview-strip__caption { display: block; margin-top: 6rpx; color: #73797e; font-size: 22rpx; }
.search-row { margin-bottom: 18rpx; }
.search-control { display: flex; min-height: 82rpx; align-items: center; gap: 14rpx; padding: 0 20rpx; border: 1rpx solid #d6d5cf; border-radius: 16rpx; background: #fbfaf7; }
.search-control input { min-width: 0; height: 80rpx; flex: 1; color: #20262d; font-size: 26rpx; }
.search-control button { display: flex; width: 52rpx; height: 52rpx; align-items: center; justify-content: center; }
.filter-scroll { width: calc(100% + 56rpx); margin-left: -28rpx; white-space: nowrap; }
.filter-row { display: inline-flex; gap: 12rpx; padding: 0 28rpx 18rpx; }
.filter-chip { display: inline-flex; min-height: 62rpx; align-items: center; gap: 9rpx; padding: 0 20rpx; border: 1rpx solid #d5d4ce; border-radius: 999rpx; background: #f9f8f4; color: #686e73; font-size: 23rpx; font-weight: 650; }
.filter-chip--active { border-color: #b93c28; background: #b93c28; color: #fffaf4; }
.filter-chip__count { display: flex; min-width: 34rpx; height: 34rpx; align-items: center; justify-content: center; padding: 0 8rpx; border-radius: 999rpx; background: rgba(76, 77, 73, .1); font-size: 19rpx; font-variant-numeric: tabular-nums; }
.filter-chip--active .filter-chip__count { background: rgba(255, 250, 244, .2); }
.proposal-list { display: flex; flex-direction: column; gap: 18rpx; }
.proposal-card { padding: 24rpx; transition: opacity 160ms ease-out, transform 160ms ease-out; }
.proposal-card--pressed { opacity: .86; transform: scale(.993); }
.proposal-card__head { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; }
.proposal-type { display: inline-flex; min-height: 46rpx; align-items: center; gap: 8rpx; padding: 0 14rpx; border-radius: 999rpx; color: #61686d; font-size: 20rpx; font-weight: 700; }
.proposal-type--lean { background: #eee8da; color: #795d28; }
.proposal-type--six { background: #e3eee8; color: #2f6953; }
.proposal-type--tool { background: #e7edf2; color: #385e78; }
.proposal-type--opl { background: #eee7f4; color: #67517d; }
.proposal-card__title { display: -webkit-box; overflow: hidden; margin-top: 18rpx; color: #22292f; font-size: 30rpx; font-weight: 760; line-height: 1.42; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.proposal-card__number { display: block; margin-top: 6rpx; color: #8a8f92; font-size: 20rpx; letter-spacing: .5rpx; }
.evidence-pair { display: grid; grid-template-columns: minmax(0, 1fr) 30rpx minmax(0, 1fr); align-items: center; gap: 8rpx; margin-top: 18rpx; }
.evidence-pair--single { grid-template-columns: minmax(0, 1fr); }
.evidence-thumb { position: relative; overflow: hidden; height: 142rpx; border-radius: 14rpx; background: #e5e4de; }
.evidence-thumb image { width: 100%; height: 100%; }
.evidence-thumb text { position: absolute; bottom: 8rpx; left: 8rpx; padding: 5rpx 10rpx; border-radius: 8rpx; background: rgba(31, 38, 44, .82); color: #fffaf4; font-size: 18rpx; font-weight: 650; }
.evidence-arrow { display: flex; align-items: center; justify-content: center; }
.proposal-card__meta { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; margin-top: 18rpx; padding-top: 17rpx; border-top: 1rpx solid #e3e2dd; }
.meta-line, .score-line, .star-group { display: flex; align-items: center; }
.meta-line { min-width: 0; gap: 7rpx; color: #72787d; font-size: 21rpx; }
.meta-separator { color: #b0b1ad; }
.score-line { flex: 0 0 auto; gap: 10rpx; }
.star-group { gap: 1rpx; }
.score-pending { color: #8b9093; font-size: 20rpx; }
.score-points { padding: 5rpx 10rpx; border-radius: 8rpx; background: #ebeae5; color: #787e82; font-size: 19rpx; font-weight: 700; }
.score-points--active { background: #f2e5cc; color: #866020; }
.reject-panel { display: flex; align-items: flex-end; gap: 18rpx; margin-top: 18rpx; padding: 18rpx; border-radius: 14rpx; background: #fff1ee; }
.reject-panel__copy { min-width: 0; flex: 1; }
.reject-panel__label { display: block; color: #9f3021; font-size: 20rpx; font-weight: 750; }
.reject-panel__reason { display: -webkit-box; overflow: hidden; margin-top: 5rpx; color: #655451; font-size: 21rpx; line-height: 1.45; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.empty-state { margin-top: 4rpx; }
.empty-state .app-icon { margin: 0 auto; }
.empty-state__action { min-width: 230rpx; margin: 24rpx auto 0; }
@media (max-width: 350px) {
  .overview-strip { align-items: flex-start; }
  .overview-strip .btn { padding: 0 18rpx; }
  .proposal-card__meta { align-items: flex-start; flex-direction: column; }
  .reject-panel { align-items: stretch; flex-direction: column; }
}
</style>
