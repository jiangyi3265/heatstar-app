<template>
  <view class="page-shell">
    <AppHeader title="提案详情" :subtitle="proposal ? displayNumber : '加载中'" :back="true" />

    <view v-if="proposal" class="page-body detail-page" :class="{ 'detail-page--action': canResubmit }">
      <view class="detail-hero surface">
        <view class="detail-hero__top">
          <view class="proposal-type" :class="`proposal-type--${proposal.type}`">
            <AppIcon :name="typeIcon" :size="28" />
            <text>{{ typeLabel }}</text>
          </view>
          <StatusTag :label="proposal.statusText || statusLabel" :status="proposal.status" />
        </view>
        <text class="detail-hero__title">{{ proposal.title }}</text>
        <button class="number-copy" @tap="copyNumber">
          <text class="mono-number">{{ displayNumber }}</text>
          <AppIcon name="copy" :size="26" tone="muted" />
        </button>
        <view class="detail-hero__meta">
          <view><AppIcon name="user-circle" :size="28" tone="muted" /><text>{{ proposal.firstAuthor }}</text></view>
          <view><AppIcon name="users" :size="28" tone="muted" /><text>{{ proposal.team }}</text></view>
          <view><AppIcon name="clock" :size="28" tone="muted" /><text>{{ proposal.submittedAt }}</text></view>
        </view>
      </view>

      <view v-if="proposal.status === 'approved'" class="outcome-band outcome-band--approved">
        <view>
          <text class="outcome-band__label">审核结果</text>
          <view class="outcome-band__stars">
            <AppIcon v-for="index in 3" :key="index" name="star" :size="34" :tone="index <= proposal.stars ? 'accent' : 'muted'" />
            <text>{{ proposal.stars }} 星采纳</text>
          </view>
        </view>
        <view class="outcome-band__points">
          <text class="mono-number">+{{ proposal.points }}</text>
          <text>积分</text>
        </view>
      </view>

      <view v-else-if="proposal.status === 'rejected'" class="outcome-band outcome-band--rejected">
        <AppIcon name="alert-triangle" :size="38" tone="accent" />
        <view>
          <text class="outcome-band__label">驳回原因</text>
          <text class="outcome-band__reason">{{ proposal.rejectReason || '请完善资料后重新提交。' }}</text>
        </view>
      </view>

      <view v-else class="review-progress surface">
        <view class="review-progress__heading">
          <text>评审进度</text>
          <text>{{ statusLabel }}</text>
        </view>
        <view class="progress-track">
          <view
            v-for="(step, index) in reviewSteps"
            :key="step.key"
            class="progress-step"
            :class="{ 'progress-step--done': statusRank > index, 'progress-step--current': statusRank === index }"
          >
            <view class="progress-step__dot">
              <AppIcon v-if="statusRank > index" name="check" :size="22" tone="inverse" />
              <text v-else>{{ index + 1 }}</text>
            </view>
            <text>{{ step.label }}</text>
          </view>
        </view>
      </view>

      <DepartmentReviewSummary :proposal="proposal" />
      <view class="section-block">
        <view class="section-heading">
          <view>
            <text class="section-title">{{ evidenceMeta.title }}</text>
            <text class="section-subtitle">{{ evidenceMeta.subtitle }}</text>
          </view>
          <text class="photo-total">{{ evidenceCountText }}</text>
        </view>
        <OplStepsView v-if="proposal.type === 'opl'" :steps="proposal.oplSteps" />
        <view v-else class="photo-compare" :class="{ 'photo-compare--single': !evidenceMeta.hasAfter }">
          <view class="photo-column surface">
            <view class="photo-column__label photo-column__label--before">
              <text>{{ evidenceMeta.before }}</text><text>{{ proposal.beforePhotos.length }} 张</text>
            </view>
            <button
              v-for="(photo, index) in proposal.beforePhotos"
              :key="`${photo}-${index}`"
              class="detail-photo"
              @tap="preview(proposal.beforePhotos, index)"
            >
              <image :src="photo" mode="aspectFill" />
              <view class="detail-photo__zoom"><AppIcon name="photo" :size="26" tone="inverse" /></view>
            </button>
          </view>
          <view v-if="evidenceMeta.hasAfter" class="photo-column surface">
            <view class="photo-column__label photo-column__label--after">
              <text>{{ evidenceMeta.after }}</text><text>{{ proposal.afterPhotos.length }} 张</text>
            </view>
            <button
              v-for="(photo, index) in proposal.afterPhotos"
              :key="`${photo}-${index}`"
              class="detail-photo"
              @tap="preview(proposal.afterPhotos, index)"
            >
              <image :src="photo" mode="aspectFill" />
              <view class="detail-photo__zoom"><AppIcon name="photo" :size="26" tone="inverse" /></view>
            </button>
          </view>
        </view>
      </view>

      <view class="section-block detail-section surface">
        <view class="detail-section__heading">
          <AppIcon name="clipboard-text" :size="34" tone="accent" />
          <text>{{ contentHeading }}</text>
        </view>
        <view v-for="item in narrativeRows" :key="item.label" class="narrative-row">
          <text class="narrative-row__label">{{ item.label }}</text>
          <text class="narrative-row__value">{{ item.value }}</text>
        </view>
      </view>

      <view class="section-block detail-section surface">
        <view class="detail-section__heading">
          <AppIcon name="list-details" :size="34" tone="accent" />
          <text>全部信息</text>
        </view>
        <view class="info-list">
          <view v-for="item in informationRows" :key="item.label" class="info-row">
            <text class="info-row__label">{{ item.label }}</text>
            <text class="info-row__value" :class="{ 'mono-number': item.mono }">{{ item.value || '未填写' }}</text>
          </view>
        </view>
      </view>

      <view v-if="hasReviewInfo" class="section-block detail-section surface">
        <view class="detail-section__heading">
          <AppIcon name="clipboard-check" :size="34" tone="accent" />
          <text>审核记录</text>
        </view>
        <view v-if="proposal.reviewer" class="info-row">
          <text class="info-row__label">最后审核人</text>
          <text class="info-row__value">{{ proposal.reviewer }}</text>
        </view>
        <view v-if="proposal.reviewComment" class="review-comment">
          <text>审核评语</text>
          <text>{{ proposal.reviewComment }}</text>
        </view>
        <view v-for="(record, index) in proposal.reviewHistory || []" :key="`${record.time}-${index}`" class="history-row">
          <view class="history-row__dot" />
          <view>
            <text class="history-row__title">{{ record.levelLabel }} · {{ record.decision === 'recommend' ? '推荐公司审核' : record.decision === 'resubmit' ? '重新提交' : record.decision === 'approve' ? `${record.stars} 星评价` : '驳回' }}</text>
            <text class="history-row__meta">{{ record.reviewer }} · {{ record.time }}</text>
            <text v-if="record.comment" class="history-row__comment">{{ record.comment }}</text>
          </view>
        </view>
      </view>
    </view>

    <view v-else class="page-body">
      <view class="empty-state surface">
        <AppIcon name="alert-triangle" :size="72" tone="muted" />
        <text class="empty-state__title">未找到该提案</text>
        <text class="empty-state__text">提案可能已被移交或编号不存在。</text>
      </view>
    </view>

    <view v-if="canResubmit" class="sticky-actions">
      <button class="btn btn--primary btn--block" @tap="editRejected">
        <AppIcon name="edit" :size="34" tone="inverse" />
        <text>修改并重新提交</text>
      </button>
    </view>
  </view>
</template>

<script>
import AppHeader from '../../components/AppHeader.vue'
import AppIcon from '../../components/AppIcon.vue'
import OplStepsView from '../../components/OplStepsView.vue'
import StatusTag from '../../components/StatusTag.vue'
import DepartmentReviewSummary from '../../components/DepartmentReviewSummary.vue'
import { getProposals } from '../../utils/storage.js'
import { ensureSynchronized } from '../../utils/api.js'
import { proposalContentHeading, proposalEvidenceLabels, proposalInformationRows, proposalNarrativeRows, proposalOplSteps, proposalTypeIcon, proposalTypeLabel } from '../../utils/proposal-types.js'

export default {
  components: { AppHeader, AppIcon, OplStepsView, StatusTag, DepartmentReviewSummary },
  data() {
    return {
      proposalId: '',
      proposal: null,
      reviewSteps: [
        { key: 'team', label: '班组长' },
        { key: 'reviewer', label: '部门小组' },
        { key: 'company', label: '公司审核' }
      ]
    }
  },
  computed: {
    displayNumber() {
      return this.proposal ? (this.proposal.sourceNo || this.proposal.id) : ''
    },
    typeLabel() {
      return this.proposal ? proposalTypeLabel(this.proposal.type) : ''
    },
    typeIcon() {
      return this.proposal ? proposalTypeIcon(this.proposal.type) : 'bulb'
    },
    evidenceMeta() {
      return proposalEvidenceLabels(this.proposal ? this.proposal.type : 'lean')
    },
    contentHeading() {
      return proposalContentHeading(this.proposal ? this.proposal.type : 'lean')
    },
    statusLabel() {
      const labels = {
        pending_team: '等待班组长审核',
        pending_review: '等待部门/制造厂小组评审',
        pending_company: '等待公司审核',
        pending_section: '部门小组待审（历史）',
        pending_factory: '部门小组待审（历史）',
        approved: '已采纳',
        rejected: '已驳回'
      }
      return this.proposal ? (labels[this.proposal.status] || '待处理') : ''
    },
    statusRank() {
      const ranks = { pending_team: 0, pending_review: 1, pending_section: 1, pending_factory: 1, pending_company: 2, approved: 3 }
      return this.proposal ? (ranks[this.proposal.status] ?? 0) : 0
    },
    photoCount() {
      return this.proposal ? this.proposal.beforePhotos.length + this.proposal.afterPhotos.length : 0
    },
    evidenceCountText() {
      if (!this.proposal) return ''
      return this.proposal.type === 'opl' ? `${this.proposal.oplSteps.length} 步` : `${this.photoCount} 张`
    },
    canResubmit() {
      return this.proposal && this.proposal.status === 'rejected'
    },
    narrativeRows() {
      return proposalNarrativeRows(this.proposal)
    },
    informationRows() {
      return proposalInformationRows(this.proposal, this.displayNumber)
    },
    hasReviewInfo() {
      if (!this.proposal) return false
      return Boolean(this.proposal.reviewer || this.proposal.reviewComment || (this.proposal.reviewHistory || []).length)
    }
  },
  async onLoad(options) {
    this.proposalId = options.id ? decodeURIComponent(options.id) : ''
    await ensureSynchronized()
    this.loadProposal()
  },
  async onShow() {
    await ensureSynchronized()
    if (this.proposalId) this.loadProposal()
  },
  methods: {
    loadProposal() {
      const found = getProposals().find(item => item.id === this.proposalId)
      if (!found) {
        this.proposal = null
        return
      }
      this.proposal = {
        ...found,
        beforePhotos: Array.isArray(found.beforePhotos) ? found.beforePhotos : [],
        afterPhotos: Array.isArray(found.afterPhotos) ? found.afterPhotos : [],
        oplSteps: proposalOplSteps(found)
      }
    },
    preview(photos, index) {
      uni.previewImage({ current: photos[index], urls: photos })
    },
    copyNumber() {
      uni.setClipboardData({ data: this.displayNumber })
    },
    editRejected() {
      uni.navigateTo({ url: `/pages/proposal/form?id=${encodeURIComponent(this.proposal.id)}` })
    }
  }
}
</script>

<style scoped>
.detail-page { padding-top: 20rpx; }
.detail-page--action { padding-bottom: calc(150rpx + env(safe-area-inset-bottom)); }
.detail-hero { padding: 26rpx; }
.detail-hero__top { display: flex; align-items: center; justify-content: space-between; gap: 14rpx; }
.proposal-type { display: inline-flex; min-height: 46rpx; align-items: center; gap: 8rpx; padding: 0 14rpx; border-radius: 999rpx; font-size: 20rpx; font-weight: 700; }
.proposal-type--lean { background: #eee8da; color: #795d28; }
.proposal-type--six { background: #e3eee8; color: #2f6953; }
.proposal-type--tool { background: #e7edf2; color: #385e78; }
.proposal-type--opl { background: #eee7f4; color: #67517d; }
.detail-hero__title { display: block; margin-top: 22rpx; color: #20272d; font-size: 36rpx; font-weight: 780; line-height: 1.4; }
.number-copy { display: inline-flex; min-height: 50rpx; align-items: center; gap: 8rpx; margin-top: 10rpx; color: #7c8286; font-size: 21rpx; }
.detail-hero__meta { display: flex; flex-wrap: wrap; gap: 12rpx 20rpx; margin-top: 20rpx; padding-top: 18rpx; border-top: 1rpx solid #e2e1dc; }
.detail-hero__meta > view { display: flex; align-items: center; gap: 7rpx; color: #686f74; font-size: 21rpx; }
.outcome-band { display: flex; align-items: center; gap: 18rpx; margin-top: 18rpx; padding: 22rpx 24rpx; border-radius: 20rpx; }
.outcome-band--approved { justify-content: space-between; background: #e5f0ea; color: #265f47; }
.outcome-band--rejected { align-items: flex-start; background: #fae6e1; color: #8e3022; }
.outcome-band__label { display: block; font-size: 21rpx; font-weight: 650; }
.outcome-band__stars { display: flex; align-items: center; gap: 2rpx; margin-top: 5rpx; font-size: 25rpx; font-weight: 750; }
.outcome-band__stars text { margin-left: 8rpx; }
.outcome-band__points { text-align: right; }
.outcome-band__points text:first-child { display: block; font-size: 36rpx; font-weight: 800; line-height: 1; }
.outcome-band__points text:last-child { display: block; margin-top: 4rpx; font-size: 20rpx; }
.outcome-band__reason { display: block; margin-top: 6rpx; color: #5d4a47; font-size: 23rpx; line-height: 1.55; }
.review-progress { margin-top: 18rpx; padding: 22rpx 24rpx; }
.review-progress__heading { display: flex; justify-content: space-between; gap: 18rpx; color: #343b41; font-size: 23rpx; font-weight: 700; }
.review-progress__heading text:last-child { color: #9c6420; font-size: 21rpx; font-weight: 600; }
.progress-track { position: relative; display: grid; grid-template-columns: repeat(3, 1fr); margin-top: 22rpx; }
.progress-track::before { position: absolute; top: 18rpx; right: 16.66%; left: 16.66%; height: 2rpx; background: #d9d8d2; content: ''; }
.progress-step { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 8rpx; color: #8a8f92; font-size: 20rpx; }
.progress-step__dot { display: flex; width: 38rpx; height: 38rpx; align-items: center; justify-content: center; border: 2rpx solid #c8c7c1; border-radius: 50%; background: #fbfaf7; font-size: 18rpx; font-weight: 700; }
.progress-step--done, .progress-step--current { color: #8d3527; font-weight: 650; }
.progress-step--done .progress-step__dot { border-color: #b93c28; background: #b93c28; color: #fffaf4; }
.progress-step--current .progress-step__dot { border-color: #b93c28; color: #a93524; box-shadow: 0 0 0 6rpx #f6e3de; }
.photo-total { color: #777d81; font-size: 22rpx; }
.photo-compare { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14rpx; }
.photo-compare--single { grid-template-columns: minmax(0, 1fr); }
.photo-column { overflow: hidden; padding: 10rpx; }
.photo-column__label { display: flex; justify-content: space-between; gap: 8rpx; padding: 8rpx 8rpx 14rpx; font-size: 21rpx; font-weight: 700; }
.photo-column__label text:last-child { color: #8a8f92; font-size: 19rpx; font-weight: 500; }
.photo-column__label--before { color: #985042; }
.photo-column__label--after { color: #2d6b51; }
.detail-photo { position: relative; display: block; width: 100%; overflow: hidden; aspect-ratio: 1; border-radius: 14rpx; background: #e3e2dd; }
.detail-photo + .detail-photo { margin-top: 10rpx; }
.detail-photo image { width: 100%; height: 100%; }
.detail-photo__zoom { position: absolute; right: 8rpx; bottom: 8rpx; display: flex; width: 42rpx; height: 42rpx; align-items: center; justify-content: center; border-radius: 50%; background: rgba(34, 41, 47, .76); }
.detail-section { padding: 24rpx; }
.detail-section__heading { display: flex; align-items: center; gap: 11rpx; margin-bottom: 20rpx; color: #293037; font-size: 27rpx; font-weight: 750; }
.narrative-row + .narrative-row { margin-top: 20rpx; padding-top: 20rpx; border-top: 1rpx solid #e2e1dc; }
.narrative-row__label { display: block; color: #8f3b2d; font-size: 21rpx; font-weight: 700; }
.narrative-row__value { display: block; margin-top: 8rpx; color: #42494f; font-size: 25rpx; line-height: 1.72; }
.info-list { border-top: 1rpx solid #e2e1dc; }
.info-row { display: grid; grid-template-columns: 190rpx minmax(0, 1fr); gap: 20rpx; padding: 19rpx 0; border-bottom: 1rpx solid #e8e7e2; }
.info-row:last-child { border-bottom: 0; }
.info-row__label { color: #7a8084; font-size: 22rpx; }
.info-row__value { color: #343b41; font-size: 23rpx; font-weight: 600; line-height: 1.5; text-align: right; word-break: break-all; }
.review-comment { margin: 10rpx 0 22rpx; padding: 18rpx; border-radius: 14rpx; background: #eeece6; }
.review-comment text:first-child { display: block; color: #777d81; font-size: 20rpx; font-weight: 650; }
.review-comment text:last-child { display: block; margin-top: 6rpx; color: #42494f; font-size: 23rpx; line-height: 1.55; }
.history-row { display: grid; grid-template-columns: 18rpx 1fr; gap: 14rpx; padding: 16rpx 0; }
.history-row__dot { width: 14rpx; height: 14rpx; margin-top: 9rpx; border-radius: 50%; background: #b93c28; box-shadow: 0 0 0 5rpx #f3e0db; }
.history-row__title { display: block; color: #343b41; font-size: 23rpx; font-weight: 700; }
.history-row__meta { display: block; margin-top: 5rpx; color: #81868a; font-size: 20rpx; }
.history-row__comment { display: block; margin-top: 6rpx; color: #60676c; font-size: 22rpx; line-height: 1.5; }
</style>
