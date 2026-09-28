<template>
  <view class="page-shell">
    <AppHeader title="审核中心" :subtitle="`${currentLevel.label} · ${displayScope}`" :back="true" />

    <view v-if="!levels.length" class="page-body">
      <view class="empty-state surface">
        <AppIcon name="shield-lock" :size="76" tone="muted" />
        <text class="empty-state__title">您没有审核权限</text>
        <text class="empty-state__text">班组长审核后，部门小组逐人评分；达到 80% 三星人数或精益专员推荐后进入公司审核。请联系管理员配置相应权限。</text>
      </view>
    </view>

    <view v-else class="page-body review-list-page">
      <view class="view-switch surface">
        <view class="view-switch__heading">
          <view>
            <text class="view-switch__title">评审阶段</text>
            <text class="view-switch__note">{{ user.name }} · {{ user.role }}</text>
          </view>
        </view>
        <view class="level-switch" :class="{ 'level-switch--single': levels.length === 1 }" role="radiogroup" aria-label="评审阶段">
          <button
            v-for="item in levels"
            :key="item.value"
            class="level-option"
            :class="{ 'level-option--active': activeLevel === item.value }"
            :aria-checked="activeLevel === item.value"
            role="radio"
            @tap="changeLevel(item.value)"
          >
            <AppIcon :name="item.icon" :size="30" :tone="activeLevel === item.value ? 'inverse' : 'muted'" />
            <text>{{ item.label }}</text>
          </button>
        </view>
        <text class="stage-description">{{ stageDescription }}</text>
      </view>

      <view v-if="activeLevel !== 'team' && departmentOptions.length" class="department-filter">
        <text>{{ activeLevel === 'company' ? '提案所属部门' : '评审部门' }}</text>
        <picker :range="departmentOptions" range-key="name" :value="departmentIndex" @change="changeDepartment">
          <view class="department-filter__value"><text>{{ selectedDepartmentLabel }}</text><AppIcon name="chevron-down" :size="28" tone="muted" /></view>
        </picker>
      </view>

      <view v-if="activeLevel === 'reviewer'" class="department-groups surface">
        <view class="department-groups__heading">
          <text class="department-groups__title">部门评审小组</text>
          <text class="department-groups__note">当前配置成员；每条提案的本轮名单以详情为准。</text>
        </view>
        <view v-for="group in departmentGroups" :key="group.id" class="department-group">
          <view class="department-group__heading">
            <text class="department-group__name">{{ group.name }}</text>
            <text class="department-group__count">{{ group.members.length }} 名评审员</text>
          </view>
          <view v-if="group.members.length" class="department-group__members">
            <text v-for="member in group.members" :key="member.workNo">{{ member.name }}<text v-if="member.workNo === user.workNo">（我）</text></text>
          </view>
          <text v-else class="department-group__empty">尚未配置评审员，请在权限管理中设置「评审员」及管辖部门。</text>
        </view>
        <text v-if="!departmentGroups.length" class="department-group__empty">当前账号尚未配置可查看的评审部门。</text>
      </view>

      <view class="scope-band">
        <view class="scope-band__icon"><AppIcon name="hierarchy-3" :size="38" tone="inverse" /></view>
        <view class="scope-band__copy">
          <text class="scope-band__label">{{ currentLevel.label }}范围</text>
          <text class="scope-band__value">{{ displayScope }}</text>
        </view>
        <view class="scope-band__count">
          <text class="mono-number">{{ pendingCount }}</text>
          <text>{{ activeLevel === 'specialist' ? '可推荐' : '待审核' }}</text>
        </view>
      </view>

      <view class="list-toolbar">
        <view class="segment-control">
          <button :class="{ active: activeTab === 'pending' }" @tap="activeTab = 'pending'">
            <text>{{ activeLevel === 'specialist' ? '可推荐' : '待审核' }}</text>
            <text>{{ pendingCount }}</text>
          </button>
          <button :class="{ active: activeTab === 'processed' }" @tap="activeTab = 'processed'">
            <text>已处理</text>
            <text>{{ processedCount }}</text>
          </button>
        </view>
        <view class="search-control">
          <AppIcon name="search" :size="32" tone="muted" />
          <input v-model.trim="keyword" placeholder="搜索提案或提交人" confirm-type="search" />
          <button v-if="keyword" aria-label="清除搜索" @tap="keyword = ''"><AppIcon name="x" :size="28" tone="muted" /></button>
        </view>
      </view>

      <view v-if="visibleItems.length" class="review-items">
        <view v-for="proposal in visibleItems" :key="proposal.id" class="review-item surface" @tap="openDetail(proposal.id)">
          <view class="review-item__status">
            <view class="proposal-type" :class="`proposal-type--${proposal.type}`">
              <AppIcon :name="typeIcon(proposal)" :size="26" />
              <text>{{ typeLabel(proposal) }}</text>
            </view>
            <StatusTag :label="statusLabel(proposal.status)" :status="proposal.status" />
          </view>

          <view class="review-item__content">
            <view class="review-item__main">
              <text class="review-item__title">{{ proposal.title }}</text>
              <text class="review-item__number mono-number">{{ proposal.sourceNo || proposal.id }}</text>
              <view class="review-item__meta">
                <text>{{ proposal.firstAuthor }}</text><text>·</text><text>{{ proposalDepartment(proposal) }}</text><text>·</text><text>{{ proposal.team }}</text><text>·</text><text>{{ shortDate(proposal.submittedAt) }}</text>
              </view>
            </view>
            <view class="evidence-preview">
              <image :src="firstPhoto(proposal)" mode="aspectFill" />
              <text>{{ evidenceLabel(proposal) }}</text>
            </view>
          </view>

          <text v-if="reviewProgress(proposal)" class="review-item__progress">{{ reviewProgress(proposal) }}</text>

          <view class="review-item__foot">
            <view class="scope-match">
              <AppIcon name="shield-check" :size="27" tone="muted" />
              <text>{{ scopeReason(proposal) }}</text>
            </view>
            <button v-if="activeTab === 'pending'" class="btn btn--primary btn--small" @tap.stop="openDetail(proposal.id)">
              <text>{{ activeLevel === 'specialist' ? '去推荐' : '去审核' }}</text><AppIcon name="chevron-right" :size="27" tone="inverse" />
            </button>
            <button v-else class="detail-link" @tap.stop="openDetail(proposal.id)">
              <text>查看记录</text><AppIcon name="chevron-right" :size="27" tone="muted" />
            </button>
          </view>
        </view>
      </view>

      <view v-else class="empty-state surface">
        <AppIcon :name="activeTab === 'pending' ? 'clipboard-check' : 'archive'" :size="76" tone="muted" />
        <text class="empty-state__title">{{ emptyTitle }}</text>
        <text class="empty-state__text">{{ emptyText }}</text>
      </view>
    </view>
  </view>
</template>

<script>
import AppHeader from '../../components/AppHeader.vue'
import AppIcon from '../../components/AppIcon.vue'
import StatusTag from '../../components/StatusTag.vue'
import { currentUser, refreshUser } from '../../utils/session.js'
import { getProposals, readStorage, STORAGE_KEYS } from '../../utils/storage.js'
import { ensureSynchronized } from '../../utils/api.js'
import { proposalTypeIcon, proposalTypeLabel } from '../../utils/proposal-types.js'
import { REVIEW_LEVELS, inReviewScope, reviewScopeLabel, canDepartmentVote, canRecommendProposal, departmentId, departmentName, getDepartments, userReviewLevels } from '../../utils/organization.js'
import { departmentReviewers, reviewDepartments, processedAtLevel, departmentProgress } from '../../utils/review-center.js'

const LEVELS_BY_SCOPE = {
  ...REVIEW_LEVELS
}

export default {
  components: { AppHeader, AppIcon, StatusTag },
  data() {
    return {
      user: currentUser() || {},
      proposals: [],
      people: [],
      departments: [],
      selectedDepartment: '',
      activeLevel: '',
      activeTab: 'pending',
      keyword: ''
    }
  },
  computed: {
    // 部门成员逐人评分，公司审核单独处理上报方案。
    levels() {
      const allowed = [...userReviewLevels(this.user), ...(this.user.canRecommend || this.user.isSuper ? ['specialist'] : [])]
      return [
        { value: 'team', label: '班组初审', icon: 'users', scope: reviewScopeLabel(this.user), pendingStatus: 'pending_team' },
        { value: 'reviewer', label: '部门评审', icon: 'clipboard-check', scope: reviewScopeLabel(this.user), pendingStatus: 'pending_review' },
        { value: 'company', label: '公司评审', icon: 'building-community', scope: reviewScopeLabel(this.user), pendingStatus: 'pending_company' },
        { value: 'specialist', label: '精益推荐', icon: 'clipboard-check', scope: reviewScopeLabel(this.user), pendingStatus: 'approved' }
      ].filter(item => allowed.includes(item.value))
    },
    currentLevel() {
      return this.levels.find(item => item.value === this.activeLevel) || this.levels[0] || { label: '', scope: '', pendingStatus: '' }
    },
    allowedDepartments() { return reviewDepartments(this.user, this.departments, this.activeLevel) },
    departmentOptions() {
      return this.allowedDepartments.length > 1 ? [{ id: '', name: '全部所辖部门' }, ...this.allowedDepartments] : this.allowedDepartments
    },
    departmentIndex() { return Math.max(0, this.departmentOptions.findIndex(d => d.id === this.selectedDepartment)) },
    selectedDepartmentLabel() { return this.departmentOptions[this.departmentIndex]?.name || '未配置部门' },
    displayScope() {
      if (this.activeLevel !== 'team' && this.selectedDepartment) return this.selectedDepartmentLabel
      return this.activeLevel === 'reviewer' ? '全部所辖部门' : this.currentLevel.scope
    },
    departmentGroups() {
      return this.allowedDepartments.filter(d => !this.selectedDepartment || d.id === this.selectedDepartment)
        .map(d => ({ ...d, members: departmentReviewers(this.people, this.departments, d.id) }))
    },
    stageDescription() {
      return {
        team: '班组长初审通过后，交由提案所属部门的评审小组逐人评分。',
        reviewer: '部门小组全员评分后结算，三星人数达到 80% 自动进入公司评审。',
        company: '集中评审各部门上报的提案，确定公司最终星级；部门评分记录完整保留。',
        specialist: '部门评审完成并结案后，可填写理由推荐公司评审。'
      }[this.activeLevel] || ''
    },
    pendingItems() {
      return this.proposals.filter(item => {
        if (!this.matchesDepartment(item)) return false
        if (this.activeLevel === 'specialist') return canRecommendProposal(this.user, item)
        if (!this.inScope(item) || item.status !== this.currentLevel.pendingStatus) return false
        return this.activeLevel !== 'reviewer' || this.user.isSuper || canDepartmentVote(this.user, item)
      })
    },
    processedItems() {
      return this.proposals.filter(item => this.matchesDepartment(item) && this.inScope(item) && this.isProcessedAtLevel(item))
    },
    pendingCount() {
      return this.pendingItems.length
    },
    processedCount() {
      return this.processedItems.length
    },
    visibleItems() {
      const source = this.activeTab === 'pending' ? this.pendingItems : this.processedItems
      const query = this.keyword.toLowerCase()
      if (!query) return source
      return source.filter(item => `${item.title || ''} ${item.id || ''} ${item.sourceNo || ''} ${item.firstAuthor || ''}`.toLowerCase().includes(query))
    },
    emptyTitle() {
      if (this.keyword) return '没有匹配的提案'
      return this.activeTab === 'pending' ? '当前范围暂无待审核提案' : '当前范围暂无处理记录'
    },
    emptyText() {
      if (this.keyword) return '请尝试更换名称、编号或提交人关键词。'
      return this.activeTab === 'pending'
        ? `${this.currentLevel.label}仅显示${this.displayScope}范围内、已流转到本阶段的提案。`
        : '完成审核后，处理结果会在这里持续保留。'
    }
  },
  async onShow() {
    await ensureSynchronized()
    this.user = await refreshUser() || {}
    this.departments = getDepartments()
    this.people = readStorage(STORAGE_KEYS.people, [])
    if (!this.levels.some(item => item.value === this.activeLevel)) {
      this.activeLevel = this.user.reviewLevel || (this.levels[0] && this.levels[0].value) || ''
    }
    if (!this.departmentOptions.some(d => d.id === this.selectedDepartment)) this.selectedDepartment = this.departmentOptions[0]?.id || ''
    this.proposals = getProposals()
  },
  methods: {
    changeDepartment(event) {
      this.selectedDepartment = this.departmentOptions[Number(event.detail.value)]?.id || ''
      this.keyword = ''
    },
    matchesDepartment(item) { return this.activeLevel === 'team' || !this.selectedDepartment || departmentId(item) === this.selectedDepartment },
    proposalDepartment(item) { return departmentName(item) },
    reviewProgress(item) { return ['reviewer', 'company'].includes(this.activeLevel) ? departmentProgress(item) : '' },
    changeLevel(level) {
      this.activeLevel = level
      if (!this.departmentOptions.some(d => d.id === this.selectedDepartment)) this.selectedDepartment = this.departmentOptions[0]?.id || ''
      this.activeTab = 'pending'
      this.keyword = ''
    },
    inScope(item) {
      // 可见范围看的是账号本身的权限，不是当前切到哪个页签。
      return inReviewScope(this.user, item, this.activeLevel)
    },
    isProcessedAtLevel(item) {
      return processedAtLevel(item, this.activeLevel, this.user)
    },
    statusLabel(status) {
      const labels = {
        pending_team: '班组长审核',
        pending_review: '部门评审中',
        pending_company: '待公司评审',
        pending_section: '部门小组待审（历史）',
        pending_factory: '部门小组待审（历史）',
        approved: '已采纳',
        rejected: '已驳回'
      }
      return labels[status] || '待处理'
    },
    scopeReason(item) {
      if (this.activeLevel === 'specialist') return '部门已结案，可推荐公司评审'
      if (this.activeLevel === 'company') return item.companyRoute === 'specialist' ? '精益专员推荐公司评审' : item.companyRoute === 'threshold' ? '部门三星人数达 80%，自动上报' : '公司评审'
      if (this.activeLevel === 'reviewer') return `${this.proposalDepartment(item)}评审小组`
      return `班组初审 · ${item.team}`
    },
    shortDate(value) {
      return String(value || '').slice(0, 10)
    },
    typeLabel(proposal) {
      return proposalTypeLabel(proposal.type)
    },
    typeIcon(proposal) {
      return proposalTypeIcon(proposal.type)
    },
    evidenceLabel(proposal) {
      if (proposal.type === 'tool') return '应用效果'
      if (proposal.type === 'opl') return '课程图片'
      return '改善后'
    },
    firstPhoto(proposal) {
      const photos = proposal.type === 'opl' ? proposal.beforePhotos : proposal.afterPhotos
      return Array.isArray(photos) && photos.length ? photos[0] : '/static/images/workshop-banner.jpg'
    },
    openDetail(id) {
      uni.navigateTo({ url: `/pages/review/detail?id=${encodeURIComponent(id)}&level=${this.activeLevel}` })
    }
  }
}
</script>

<style scoped>
.review-list-page { padding-top: 20rpx; }
.view-switch { padding: 22rpx; }
.view-switch__heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 18rpx; }
.view-switch__title { display: block; color: #30373d; font-size: 25rpx; font-weight: 750; }
.view-switch__note { display: block; margin-top: 4rpx; color: #82878a; font-size: 20rpx; }
.demo-tag { padding: 5rpx 12rpx; border-radius: 999rpx; background: #ede3d1; color: #7c5a20; font-size: 18rpx; font-weight: 700; }
.level-switch { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10rpx; margin-top: 18rpx; padding: 6rpx; border-radius: 16rpx; background: #ebeae5; }
.level-switch--single { grid-template-columns: minmax(0, 1fr); }
.level-option { display: flex; min-width: 0; min-height: 88rpx; align-items: center; justify-content: center; gap: 7rpx; border-radius: 12rpx; color: #5f666b; font-size: 28rpx; font-weight: 650; }
.level-option--active { background: #29333b; color: #f9f8f3; box-shadow: 0 5rpx 12rpx rgba(40, 49, 57, .16); }
.scope-band { display: flex; align-items: center; gap: 16rpx; margin-top: 16rpx; padding: 20rpx 22rpx; border-radius: 20rpx; background: #3d4b53; color: #f7f6f1; }
.scope-band__icon { display: flex; width: 58rpx; height: 58rpx; flex: 0 0 auto; align-items: center; justify-content: center; border-radius: 16rpx; background: rgba(247, 246, 241, .12); }
.scope-band__copy { min-width: 0; flex: 1; }
.scope-band__label { display: block; color: #cbd0d1; font-size: 20rpx; }
.scope-band__value { display: block; margin-top: 4rpx; font-size: 26rpx; font-weight: 730; }
.scope-band__count { text-align: right; }
.scope-band__count text:first-child { display: block; font-size: 34rpx; font-weight: 800; line-height: 1; }
.scope-band__count text:last-child { display: block; margin-top: 5rpx; color: #cbd0d1; font-size: 19rpx; }
.list-toolbar { margin-top: 22rpx; }
.segment-control { display: grid; grid-template-columns: repeat(2, 1fr); border-bottom: 1rpx solid #d8d7d1; }
.segment-control button { position: relative; display: flex; min-height: 72rpx; align-items: center; justify-content: center; gap: 8rpx; color: #777d81; font-size: 24rpx; font-weight: 650; }
.segment-control button::after { position: absolute; right: 22%; bottom: -1rpx; left: 22%; height: 4rpx; border-radius: 999rpx; background: transparent; content: ''; }
.segment-control button.active { color: #9e3223; }
.segment-control button.active::after { background: #b93c28; }
.segment-control button text:last-child { display: flex; min-width: 32rpx; height: 32rpx; align-items: center; justify-content: center; padding: 0 7rpx; border-radius: 999rpx; background: #e4e3de; font-size: 18rpx; }
.segment-control button.active text:last-child { background: #f2ded8; }
.search-control { display: flex; min-height: 78rpx; align-items: center; gap: 12rpx; margin: 18rpx 0; padding: 0 18rpx; border: 1rpx solid #d8d7d1; border-radius: 15rpx; background: #fbfaf7; }
.search-control input { min-width: 0; height: 76rpx; flex: 1; font-size: 25rpx; }
.search-control button { display: flex; width: 48rpx; height: 48rpx; align-items: center; justify-content: center; }
.review-items { display: flex; flex-direction: column; gap: 16rpx; }
.review-item { padding: 22rpx; }
.review-item__status { display: flex; align-items: center; justify-content: space-between; gap: 12rpx; }
.proposal-type { display: inline-flex; min-height: 44rpx; align-items: center; gap: 7rpx; padding: 0 13rpx; border-radius: 999rpx; font-size: 20rpx; font-weight: 700; }
.proposal-type--lean { background: #eee8da; color: #795d28; }
.proposal-type--six { background: #e3eee8; color: #2f6953; }
.proposal-type--tool { background: #e7edf2; color: #385e78; }
.proposal-type--opl { background: #eee7f4; color: #67517d; }
.review-item__content { display: flex; gap: 18rpx; margin-top: 18rpx; }
.review-item__main { min-width: 0; flex: 1; }
.review-item__title { display: -webkit-box; overflow: hidden; color: #242b31; font-size: 29rpx; font-weight: 750; line-height: 1.42; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.review-item__number { display: block; margin-top: 7rpx; color: #888d90; font-size: 19rpx; }
.review-item__meta { display: flex; flex-wrap: wrap; gap: 6rpx; margin-top: 12rpx; color: #70767b; font-size: 21rpx; }
.evidence-preview { position: relative; width: 152rpx; height: 118rpx; flex: 0 0 auto; overflow: hidden; border-radius: 14rpx; background: #e2e1dc; }
.evidence-preview image { width: 100%; height: 100%; }
.evidence-preview text { position: absolute; right: 7rpx; bottom: 7rpx; padding: 4rpx 8rpx; border-radius: 7rpx; background: rgba(34, 41, 47, .78); color: #fffaf4; font-size: 17rpx; }
.review-item__foot { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; margin-top: 18rpx; padding-top: 17rpx; border-top: 1rpx solid #e3e2dd; }
.scope-match { display: flex; min-width: 0; align-items: center; gap: 7rpx; color: #73797d; font-size: 20rpx; }
.detail-link { display: flex; min-height: 58rpx; align-items: center; gap: 4rpx; color: #62696e; font-size: 22rpx; font-weight: 650; }
.empty-state .app-icon { margin: 0 auto; }
.empty-state__title, .empty-state__text { display: block; }
.stage-description { display: block; margin-top: 18rpx; color: oklch(0.47 0.015 240); font-size: 26rpx; line-height: 1.65; }
.department-filter { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12rpx; margin: 24rpx 0 16rpx; font-size: 28rpx; }
.department-filter > text { color: oklch(0.47 0.015 240); }
.department-filter picker { min-width: 0; flex: 1; }
.department-filter__value { display: flex; min-height: 88rpx; align-items: center; justify-content: space-between; gap: 12rpx; padding: 12rpx 20rpx; border: 1rpx solid #deddd7; border-radius: 12rpx; background: #fbfaf7; }
.department-filter__value > text { overflow-wrap: anywhere; }
.department-groups { padding: 24rpx; }
.department-groups__title { display: block; font-size: 30rpx; font-weight: 750; }
.department-groups__note { display: block; margin-top: 8rpx; color: oklch(0.47 0.015 240); font-size: 24rpx; line-height: 1.65; }
.department-group { margin-top: 20rpx; padding-top: 20rpx; border-top: 1rpx solid #deddd7; }
.department-group__heading { display: flex; align-items: baseline; justify-content: space-between; gap: 16rpx; }
.department-group__name { min-width: 0; font-size: 28rpx; font-weight: 700; overflow-wrap: anywhere; }
.department-group__count { flex-shrink: 0; color: oklch(0.47 0.015 240); font-size: 24rpx; }
.department-group__members { display: flex; flex-wrap: wrap; gap: 12rpx 24rpx; margin-top: 14rpx; font-size: 28rpx; line-height: 1.6; }
.department-group__empty { display: block; margin-top: 12rpx; font-size: 26rpx; line-height: 1.65; color: oklch(0.47 0.015 240); }
.review-item__progress { display: block; margin-top: 18rpx; font-size: 26rpx; line-height: 1.6; color: #375f76; }
.level-option:focus-visible, .department-filter__value:focus-visible { outline: 2px solid #b93c28; outline-offset: 2px; }
@media (min-width: 768px) { .level-switch { grid-template-columns: repeat(4, minmax(0, 1fr)); } .level-switch--single { grid-template-columns: minmax(0, 1fr); } }
</style>
