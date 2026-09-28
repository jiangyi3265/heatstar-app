<template>
  <view class="page-shell">
    <AppHeader :title="canRecommend ? '推荐提案' : '审核提案'" :subtitle="`${levelConfig.label} · ${levelConfig.scope}`" :back="true" />

    <view v-if="proposal" class="page-body review-detail-page" :class="{ 'review-detail-page--action': canReview || canRecommend }">
      <view class="scope-context">
        <view class="scope-context__icon"><AppIcon name="shield-check" :size="38" tone="inverse" /></view>
        <view class="scope-context__copy">
          <text>{{ activeLevel === 'specialist' ? '精益专员推荐' : levelConfig.label }}</text>
          <text>{{ levelConfig.scope }} · 当前提案{{ inScope ? '在管辖范围内' : '不在管辖范围内' }}</text>
        </view>
        <StatusTag :label="proposal.statusText || statusLabel(proposal.status)" :status="proposal.status" />
      </view>

      <view class="proposal-summary surface">
        <view class="proposal-summary__type" :class="`proposal-summary__type--${proposal.type}`">
          <AppIcon :name="typeIcon" :size="28" />
          <text>{{ typeLabel }}</text>
        </view>
        <text class="proposal-summary__title">{{ proposal.title }}</text>
        <text class="proposal-summary__number mono-number">{{ displayNumber }}</text>
        <view class="proposal-summary__meta">
          <view><text>提交人</text><text>{{ proposal.firstAuthor }}</text></view>
          <view><text>所属部门</text><text>{{ proposalDepartment }}</text></view>
          <view><text>班组</text><text>{{ proposal.team }}</text></view>
          <view><text>时间</text><text>{{ proposal.submittedAt }}</text></view>
        </view>
      </view>

      <DepartmentReviewSummary :proposal="proposal" />
      <view class="section-block">
        <view class="section-heading">
          <view>
            <text class="section-title">{{ evidenceMeta.title }}</text>
            <text class="section-subtitle">{{ evidenceMeta.subtitle }}</text>
          </view>
          <text class="evidence-count">{{ evidenceCountText }}</text>
        </view>
        <OplStepsView v-if="proposal.type === 'opl'" :steps="proposal.oplSteps" />
        <view v-else class="evidence-compare" :class="{ 'evidence-compare--single': !evidenceMeta.hasAfter }">
          <view class="evidence-column">
            <view class="evidence-column__head evidence-column__head--before"><text>{{ evidenceMeta.before }}</text><text>{{ proposal.beforePhotos.length }}</text></view>
            <button v-for="(photo, index) in proposal.beforePhotos" :key="`${photo}-${index}`" class="evidence-photo" @tap="preview(proposal.beforePhotos, index)">
              <image :src="photo" mode="aspectFill" />
              <view><AppIcon name="eye" :size="27" tone="inverse" /></view>
            </button>
          </view>
          <view v-if="evidenceMeta.hasAfter" class="evidence-column">
            <view class="evidence-column__head evidence-column__head--after"><text>{{ evidenceMeta.after }}</text><text>{{ proposal.afterPhotos.length }}</text></view>
            <button v-for="(photo, index) in proposal.afterPhotos" :key="`${photo}-${index}`" class="evidence-photo" @tap="preview(proposal.afterPhotos, index)">
              <image :src="photo" mode="aspectFill" />
              <view><AppIcon name="eye" :size="27" tone="inverse" /></view>
            </button>
          </view>
        </view>
      </view>

      <view class="section-block content-section surface">
        <view class="content-section__heading">
          <AppIcon name="clipboard-text" :size="34" tone="accent" />
          <text>{{ contentHeading }}</text>
        </view>
        <view v-for="item in narrativeRows" :key="item.label" class="narrative-block">
          <text class="narrative-block__label">{{ item.label }}</text>
          <text class="narrative-block__value">{{ item.value || '未填写' }}</text>
        </view>
      </view>

      <view class="section-block content-section surface">
        <view class="content-section__heading">
          <AppIcon name="list-details" :size="34" tone="accent" />
          <text>提案全部信息</text>
        </view>
        <view class="info-table">
          <view v-for="item in informationRows" :key="item.label" class="info-table__row">
            <text>{{ item.label }}</text>
            <text :class="{ 'mono-number': item.mono }">{{ item.value || '未填写' }}</text>
          </view>
        </view>
      </view>

      <view v-if="(proposal.reviewHistory || []).length" class="section-block content-section surface">
        <view class="content-section__heading">
          <AppIcon name="history" :size="34" tone="accent" />
          <text>前序审核记录</text>
        </view>
        <view v-for="(record, index) in proposal.reviewHistory" :key="`${record.time}-${index}`" class="review-record">
          <view class="review-record__mark"><AppIcon :name="record.decision === 'approve' ? 'check' : 'x'" :size="24" tone="inverse" /></view>
          <view class="review-record__body">
            <view class="review-record__title">
              <text>{{ record.levelLabel }}</text>
              <text>{{ record.decision === 'recommend' ? '推荐公司审核' : record.decision === 'resubmit' ? '重新提交' : record.decision === 'approve' ? `${record.stars} 星评价` : '驳回' }}</text>
            </view>
            <text class="review-record__meta">{{ record.reviewer }} · {{ record.time }}</text>
            <text v-if="record.comment" class="review-record__comment">{{ record.comment }}</text>
          </view>
        </view>
      </view>

      <view v-if="canReview" class="section-block decision-section surface">
        <view class="decision-section__heading">
          <view>
            <text class="decision-section__title">审核结论</text>
            <text class="decision-section__subtitle">结论将写入提案记录并更新评审状态</text>
          </view>
          <text class="required-note">必填</text>
        </view>

        <view class="decision-toggle">
          <button :class="{ active: decision === 'approve' }" @tap="decision = 'approve'">
            <AppIcon name="circle-check" :size="34" :tone="decision === 'approve' ? 'inverse' : 'muted'" />
            <text>采纳</text>
          </button>
          <button :class="{ active: decision === 'reject', reject: decision === 'reject' }" @tap="decision = 'reject'">
            <AppIcon name="circle-x" :size="34" :tone="decision === 'reject' ? 'inverse' : 'muted'" />
            <text>驳回</text>
          </button>
        </view>

        <template v-if="decision === 'approve'">
          <view class="field-group star-field">
            <view class="field-label"><text>评定星级</text><text class="field-required">*</text></view>
            <view class="star-options">
              <button
                v-for="item in starOptions"
                :key="item.value"
                class="star-option"
                :class="{ 'star-option--active': selectedStars === item.value }"
                @tap="selectedStars = item.value"
              >
                <view class="star-option__stars">
                  <AppIcon v-for="index in item.value" :key="index" name="star" :size="30" :tone="selectedStars === item.value ? 'inverse' : 'accent'" />
                </view>
                <text class="star-option__label">{{ item.label }}</text>
                <text class="star-option__points">{{ item.points }} 分</text>
              </button>
            </view>
            <text class="field-hint">部门结案或公司终审采纳后，按最终星级计分：{{ ruleText }}。待公司审核期间不重复计分。</text>
          </view>

          <view class="field-group">
            <view class="field-label"><text>审核评语</text><text class="optional-label">选填</text></view>
            <textarea v-model.trim="reviewComment" class="textarea-control" maxlength="300" placeholder="可填写改善亮点、验证意见或推广建议" />
            <view class="field-footer"><text>评语将对提交人可见</text><text>{{ reviewComment.length }}/300</text></view>
          </view>

          <view class="flow-notice">
            <AppIcon name="hierarchy-3" :size="32" tone="soft" />
            <text>{{ approvalFlowText }}</text>
          </view>
        </template>

        <template v-else>
          <view class="field-group reject-field">
            <view class="field-label"><text>不采纳原因</text><text class="field-required">*</text></view>
            <textarea v-model.trim="rejectReason" class="textarea-control" maxlength="300" placeholder="请明确说明需补充的内容、证据或不采纳依据" />
            <view class="field-footer field-footer--danger"><text>驳回后，提交人可保留原编号修改重提</text><text>{{ rejectReason.length }}/300</text></view>
          </view>
        </template>
      </view>

      <view v-else class="section-block unavailable-notice">
        <AppIcon :name="proposal.status === 'approved' ? 'circle-check' : proposal.status === 'rejected' ? 'circle-x' : 'info-circle'" :size="38" tone="soft" />
        <view>
          <text>{{ unavailableTitle }}</text>
          <text>{{ unavailableText }}</text>
        </view>
      </view>
      <view v-if="canRecommend" class="section-block decision-section surface">
        <text class="decision-section__title">精益专员推荐</text>
        <text class="field-hint">部门小组已完成评审，可不受 80% 三星人数限制推荐公司。推荐后待公司重新确定最终星级，原部门评分完整保留。</text>
        <view class="field-group">
          <view class="field-label"><text>推荐原因</text><text class="field-required">*</text></view>
          <textarea v-model.trim="recommendationReason" class="textarea-control" maxlength="300" placeholder="说明推荐到公司评审的依据" />
        </view>
      </view>
    </view>

    <view v-else class="page-body">
      <view class="empty-state surface">
        <AppIcon name="alert-triangle" :size="72" tone="muted" />
        <text class="empty-state__title">未找到该提案</text>
        <text class="empty-state__text">提案可能已被处理、移交或编号不存在。</text>
      </view>
    </view>

    <view v-if="canRecommend" class="sticky-actions">
      <button class="btn btn--primary btn--block" :disabled="submitting || !recommendationReason" @tap="recommend">{{ submitting ? '正在推荐' : '推荐到公司审核' }}</button>
    </view>
    <view v-else-if="canReview" class="sticky-actions">
      <button
        class="btn btn--block"
        :class="decision === 'reject' ? 'btn--danger' : 'btn--primary'"
        :disabled="submitting"
        @tap="confirmDecision"
      >
        <AppIcon :name="decision === 'reject' ? 'circle-x' : 'circle-check'" :size="34" :tone="decision === 'reject' ? 'accent' : 'inverse'" />
        <text>{{ submitting ? '正在提交' : decision === 'reject' ? '确认驳回' : activeLevel === 'reviewer' ? '提交本人评分' : activeLevel === 'company' ? '确认公司审核结果' : '确认采纳并提交部门小组' }}</text>
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
import { pointRules } from '../../utils/mock.js'
import { formatNow, getProposals, readStorage, saveProposalConfirmed, STORAGE_KEYS } from '../../utils/storage.js'
import { ensureSynchronized } from '../../utils/api.js'
import { currentUser } from '../../utils/session.js'
import { activeRules } from '../../utils/stats.js'
import { REVIEW_LEVELS, inReviewScope, reviewScopeLabel, canDepartmentVote, canRecommendProposal, departmentName, userReviewLevels } from '../../utils/organization.js'
import { proposalContentHeading, proposalEvidenceLabels, proposalInformationRows, proposalNarrativeRows, proposalOplSteps, proposalTypeIcon, proposalTypeLabel } from '../../utils/proposal-types.js'

const LEVELS = {
  team: { value: 'team', label: '班组初审', expected: 'pending_team', next: 'pending_review', nextText: '部门评审小组' },
  reviewer: { value: 'reviewer', label: '部门评审', expected: 'pending_review', next: 'approved', nextText: '小组评分已提交' },
  company: { value: 'company', label: '公司评审', expected: 'pending_company', next: 'approved', nextText: '已采纳' },
  specialist: { value: 'specialist', label: '精益专员', expected: 'approved', next: 'pending_company', nextText: '公司审核' }
}
// 提案当前停在哪一级，就用哪一级的审核动作。
const LEVEL_BY_STATUS = { pending_team: 'team', pending_review: 'reviewer', pending_company: 'company' }
const LEVELS_BY_SCOPE = REVIEW_LEVELS

export default {
  components: { AppHeader, AppIcon, OplStepsView, StatusTag, DepartmentReviewSummary },
  data() {
    return {
      user: currentUser() || {},
      proposalId: '',
      activeLevel: 'team',
      proposal: null,
      decision: 'approve',
      selectedStars: 0,
      reviewComment: '',
      rejectReason: '',
      submitting: false,
      recommendationReason: '',
      rules: pointRules,
      starOptions: [
        { value: 1, label: '一般改善', points: pointRules.oneStar },
        { value: 2, label: '明显改善', points: pointRules.twoStar },
        { value: 3, label: '推广价值', points: pointRules.threeStar }
      ]
    }
  },
  computed: {
    proposalDepartment() { return departmentName(this.proposal) },
    levelConfig() {
      const base = LEVELS[this.activeLevel] || LEVELS.team
      return { ...base, reviewer: this.user.name || '', scope: this.scopeLabel }
    },
    // 管辖范围写的是登录账号自己的范围，不是页签。
    scopeLabel() {
      if (this.activeLevel === 'reviewer' && this.proposal) return departmentName(this.proposal)
      return reviewScopeLabel(this.user, this.activeLevel)
    },
    displayNumber() {
      return this.proposal ? (this.proposal.sourceNo || this.proposal.id) : ''
    },
    typeLabel() {
      return this.proposal ? proposalTypeLabel(this.proposal.type, true) : ''
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
    totalPhotos() {
      return this.proposal ? this.proposal.beforePhotos.length + this.proposal.afterPhotos.length : 0
    },
    evidenceCountText() {
      if (!this.proposal) return ''
      return this.proposal.type === 'opl' ? `${this.proposal.oplSteps.length} 步` : `${this.totalPhotos} 张证据`
    },
    inScope() {
      if (!this.proposal) return false
      return inReviewScope(this.user, this.proposal, this.activeLevel)
    },
    canReview() {
      if (!this.proposal || !this.inScope) return false
      // 必须真的有这一级的权限，且提案正停在这一级。
      const allowed = userReviewLevels(this.user)
      if (!allowed.includes(this.activeLevel)) return false
      if (this.activeLevel === 'reviewer') return canDepartmentVote(this.user, this.proposal)
      return this.proposal.status === this.levelConfig.expected
    },
    canRecommend() { return this.proposal && canRecommendProposal(this.user, this.proposal) },
    narrativeRows() {
      return proposalNarrativeRows(this.proposal)
    },
    informationRows() {
      return proposalInformationRows(this.proposal, this.displayNumber)
    },
    ruleText() {
      return `1 星 ${this.rules.oneStar} 分、2 星 ${this.rules.twoStar} 分、3 星 ${this.rules.threeStar} 分`
    },
    approvalFlowText() {
      if (this.activeLevel === 'reviewer') return '仅提交本人评分。全员评完后，三星人数达到 80% 自动上报公司；否则平均星级向下取整，在部门结案。班组长评分不计入。'
      if (this.activeLevel === 'company') return '公司审核完成后，以公司最终星级计入积分，部门历史评分保留。'
      return `采纳后提案将进入${this.levelConfig.nextText}，当前评星会随审核记录一并保留。`
    },
    unavailableTitle() {
      if (!this.proposal) return ''
      if (this.activeLevel === 'reviewer' && this.proposal.departmentReview?.votes?.some(v => v.workNo === this.user.workNo)) return '您已提交本轮评分'
      if (this.proposal.status === 'approved') return '该提案已完成评审'
      if (this.proposal.status === 'rejected') return '该提案已被驳回'
      if (!this.inScope) return '提案不在当前管辖范围'
      return '提案尚未流转到当前层级'
    },
    unavailableText() {
      if (!this.proposal) return ''
      if (this.proposal.status === 'pending_review' && !this.canReview) return '每位名单成员只评一次，请查看上方小组评分进度。管理员不能代替成员投票。'
      if (this.proposal.status === 'approved') return `${this.proposal.stars || 0} 星采纳，已计入 ${this.proposal.points || 0} 积分。`
      if (this.proposal.status === 'rejected') return this.proposal.rejectReason || '提交人可修改内容后保留原编号重新提交。'
      if (!this.inScope) return `当前身份仅可审核${this.levelConfig.scope}范围内的提案。`
      return `当前状态为“${this.statusLabel(this.proposal.status)}”，请等待前序审核完成。`
    }
  },
  async onLoad(options) {
    this.proposalId = options.id ? decodeURIComponent(options.id) : ''
    await ensureSynchronized()
    this.rules = activeRules()
    this.starOptions = this.starOptions.map(option => ({...option,points:{1:this.rules.oneStar,2:this.rules.twoStar,3:this.rules.threeStar}[option.value]}))
    this.user = currentUser() || {}
    this.loadProposal()
    // 审核层级由提案自己的状态决定，避免用地址栏参数越级审核。
    const byStatus = this.proposal && LEVEL_BY_STATUS[this.proposal.status]
    this.activeLevel = byStatus || (LEVELS[options.level] ? options.level : 'team')
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
        oplSteps: proposalOplSteps(found),
        reviewHistory: Array.isArray(found.reviewHistory) ? found.reviewHistory : []
      }
      this.selectedStars = 0
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
    preview(photos, index) {
      uni.previewImage({ current: photos[index], urls: photos })
    },
    confirmDecision() {
      if (this.decision === 'approve' && ![1,2,3].includes(this.selectedStars)) {
        uni.showToast({ title: '请选择 1 至 3 星', icon: 'none' })
        return
      }
      if (this.decision === 'approve' && !this.selectedStars) {
        uni.showToast({ title: '请选择 1 至 3 星', icon: 'none' })
        return
      }
      if (this.decision === 'reject' && !this.rejectReason.trim()) {
        uni.showToast({ title: '驳回必须填写不采纳原因', icon: 'none', duration: 2200 })
        return
      }
      const title = this.decision === 'approve' ? '确认采纳' : '确认驳回'
      const content = this.decision === 'approve'
        ? `${this.selectedStars} 星采纳，${this.approvalFlowText}`
        : '驳回后提案将退回提交人，原编号会继续保留。'
      uni.showModal({
        title,
        content,
        confirmText: this.decision === 'approve' ? '确认采纳' : '确认驳回',
        confirmColor: this.decision === 'approve' ? '#b93c28' : '#a83222',
        success: result => {
          if (result.confirm) this.submitDecision()
        }
      })
    },
    async submitDecision() {
      if (!this.canReview || this.submitting) return
      this.submitting = true
      const approved = this.decision === 'approve'
      const now = formatNow()
      const comment = approved ? this.reviewComment.trim() : this.rejectReason.trim()
      const nextStatus = approved ? this.levelConfig.next : 'rejected'
      const nextStatusText = approved ? this.levelConfig.nextText : '已驳回'
      const pointsByStar = {
        1: Number(this.rules.oneStar),
        2: Number(this.rules.twoStar),
        3: Number(this.rules.threeStar)
      }
      const finalApproval = approved && nextStatus === 'approved'
      const history = [
        ...(this.proposal.reviewHistory || []),
        {
          level: this.activeLevel,
          levelLabel: this.levelConfig.label,
          reviewer: this.levelConfig.reviewer,
          reviewerWorkNo: this.user.workNo || '',
          decision: this.decision,
          stars: approved ? this.selectedStars : 0,
          comment,
          time: now
        }
      ]
      const updated = {
        ...this.proposal,
        status: nextStatus,
        statusText: nextStatusText,
        stars: approved ? this.selectedStars : 0,
        points: finalApproval ? pointsByStar[this.selectedStars] : 0,
        reviewer: this.levelConfig.reviewer,
        reviewerWorkNo: this.user.workNo || '',
        reviewedAt: now,
        reviewComment: approved ? this.reviewComment.trim() : '',
        rejectReason: approved ? '' : this.rejectReason.trim(),
        reviewHistory: history
      }
      try {
        this.proposal = await saveProposalConfirmed(updated)
      } catch (error) {
        this.submitting = false
        uni.showToast({ title: error.message || '审核提交失败，请重试', icon: 'none' })
        return
      }
      uni.showToast({ title: this.proposal.status === 'pending_company' ? '已进入公司审核' : this.proposal.status === 'approved' ? '已完成评审' : this.proposal.status === 'pending_review' ? '已提交部门小组' : '已驳回', icon: 'success' })
      setTimeout(() => uni.navigateBack(), 700)
    },
    recommend() {
      if (!this.canRecommend || this.submitting || !this.recommendationReason.trim()) return
      uni.showModal({ title:'推荐到公司审核？', content:'部门评审记录将保留，方案进入公司待审，最终星级和积分由公司审核确定。',
        success: async result => {
          if (!result.confirm || this.submitting) return
          this.submitting = true
          try {
            this.proposal = await saveProposalConfirmed({...this.proposal, reviewAction:'recommend', recommendationReason:this.recommendationReason.trim()})
            uni.showToast({title:'已推荐公司审核',icon:'success'})
            setTimeout(() => uni.navigateBack(),700)
          } catch (error) { uni.showToast({title:error.message || '推荐失败，请刷新重试',icon:'none'}) }
          finally { this.submitting = false }
        }
      })
    }
  }
}
</script>

<style scoped>
.review-detail-page { padding-top: 20rpx; }
.review-detail-page--action { padding-bottom: calc(150rpx + env(safe-area-inset-bottom)); }
.scope-context { display: flex; align-items: center; gap: 14rpx; margin-bottom: 16rpx; padding: 18rpx 20rpx; border-radius: 18rpx; background: #3d4b53; color: #f6f5f0; }
.scope-context__icon { display: flex; width: 54rpx; height: 54rpx; flex: 0 0 auto; align-items: center; justify-content: center; border-radius: 15rpx; background: rgba(246, 245, 240, .12); }
.scope-context__copy { min-width: 0; flex: 1; }
.scope-context__copy text:first-child { display: block; font-size: 24rpx; font-weight: 730; }
.scope-context__copy text:last-child { display: block; margin-top: 3rpx; color: #cbd0d1; font-size: 19rpx; }
.proposal-summary { padding: 25rpx; }
.proposal-summary__type { display: inline-flex; min-height: 46rpx; align-items: center; gap: 8rpx; padding: 0 14rpx; border-radius: 999rpx; font-size: 20rpx; font-weight: 700; }
.proposal-summary__type--lean { background: #eee8da; color: #795d28; }
.proposal-summary__type--six { background: #e3eee8; color: #2f6953; }
.proposal-summary__type--tool { background: #e7edf2; color: #385e78; }
.proposal-summary__type--opl { background: #eee7f4; color: #67517d; }
.proposal-summary__title { display: block; margin-top: 17rpx; color: #22292f; font-size: 34rpx; font-weight: 780; line-height: 1.42; }
.proposal-summary__number { display: block; margin-top: 7rpx; color: #858a8e; font-size: 20rpx; }
.proposal-summary__meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14rpx 20rpx; margin-top: 20rpx; padding-top: 18rpx; border-top: 1rpx solid #e2e1dc; }
.proposal-summary__meta > view:last-child { grid-column: 1 / -1; }
.proposal-summary__meta text:first-child { display: block; color: #858a8e; font-size: 19rpx; }
.proposal-summary__meta text:last-child { display: block; margin-top: 3rpx; color: #454c52; font-size: 22rpx; font-weight: 650; }
.evidence-count { color: #7c8286; font-size: 21rpx; }
.evidence-compare { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14rpx; }
.evidence-compare--single { grid-template-columns: minmax(0, 1fr); }
.evidence-column { overflow: hidden; padding: 10rpx; border: 1rpx solid #deddd7; border-radius: 20rpx; background: #fbfaf7; }
.evidence-column__head { display: flex; align-items: center; justify-content: space-between; padding: 8rpx 8rpx 14rpx; font-size: 22rpx; font-weight: 730; }
.evidence-column__head text:last-child { display: flex; min-width: 32rpx; height: 32rpx; align-items: center; justify-content: center; padding: 0 7rpx; border-radius: 999rpx; background: #ebeae5; color: #747a7e; font-size: 18rpx; }
.evidence-column__head--before { color: #985042; }
.evidence-column__head--after { color: #2e6c52; }
.evidence-photo { position: relative; display: block; width: 100%; overflow: hidden; aspect-ratio: 1; border-radius: 13rpx; background: #e2e1dc; }
.evidence-photo + .evidence-photo { margin-top: 10rpx; }
.evidence-photo image { width: 100%; height: 100%; }
.evidence-photo > view { position: absolute; right: 8rpx; bottom: 8rpx; display: flex; width: 44rpx; height: 44rpx; align-items: center; justify-content: center; border-radius: 50%; background: rgba(34, 41, 47, .74); }
.content-section { padding: 24rpx; }
.content-section__heading { display: flex; align-items: center; gap: 10rpx; margin-bottom: 20rpx; color: #293037; font-size: 27rpx; font-weight: 750; }
.narrative-block + .narrative-block { margin-top: 20rpx; padding-top: 20rpx; border-top: 1rpx solid #e1e0db; }
.narrative-block__label { display: block; color: #913b2e; font-size: 21rpx; font-weight: 730; }
.narrative-block__value { display: block; margin-top: 8rpx; color: #42494f; font-size: 25rpx; line-height: 1.72; }
.info-table { border-top: 1rpx solid #e2e1dc; }
.info-table__row { display: grid; grid-template-columns: 190rpx minmax(0, 1fr); gap: 18rpx; padding: 18rpx 0; border-bottom: 1rpx solid #e8e7e2; }
.info-table__row:last-child { border-bottom: 0; }
.info-table__row text:first-child { color: #7b8185; font-size: 21rpx; }
.info-table__row text:last-child { color: #353c42; font-size: 23rpx; font-weight: 620; line-height: 1.5; text-align: right; word-break: break-all; }
.review-record { display: grid; grid-template-columns: 42rpx minmax(0, 1fr); gap: 14rpx; padding: 15rpx 0; }
.review-record + .review-record { border-top: 1rpx solid #e5e4df; }
.review-record__mark { display: flex; width: 38rpx; height: 38rpx; align-items: center; justify-content: center; border-radius: 50%; background: #536a60; }
.review-record__title { display: flex; justify-content: space-between; gap: 14rpx; color: #343b41; font-size: 22rpx; font-weight: 700; }
.review-record__title text:last-child { color: #2d6c51; }
.review-record__meta { display: block; margin-top: 5rpx; color: #858a8e; font-size: 19rpx; }
.review-record__comment { display: block; margin-top: 7rpx; color: #5d6469; font-size: 22rpx; line-height: 1.5; }
.decision-section { padding: 25rpx 24rpx 4rpx; }
.decision-section__heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16rpx; }
.decision-section__title { display: block; color: #22292f; font-size: 30rpx; font-weight: 780; }
.decision-section__subtitle { display: block; margin-top: 5rpx; color: #808589; font-size: 21rpx; }
.required-note { padding: 5rpx 11rpx; border-radius: 999rpx; background: #f3dfd9; color: #9a3324; font-size: 18rpx; font-weight: 700; }
.decision-toggle { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12rpx; margin: 22rpx 0 26rpx; }
.decision-toggle button { display: flex; min-height: 76rpx; align-items: center; justify-content: center; gap: 9rpx; border: 1rpx solid #d7d6d0; border-radius: 15rpx; background: #f8f7f3; color: #6d7377; font-size: 25rpx; font-weight: 700; }
.decision-toggle button.active { border-color: #3d6653; background: #3d6653; color: #f9f8f3; }
.decision-toggle button.reject { border-color: #a93a2a; background: #a93a2a; }
.star-options { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10rpx; }
.star-option { display: flex; min-height: 130rpx; flex-direction: column; align-items: center; justify-content: center; gap: 7rpx; padding: 12rpx 6rpx; border: 1rpx solid #dad9d3; border-radius: 15rpx; background: #f9f8f4; color: #656c71; }
.star-option--active { border-color: #b93c28; background: #b93c28; color: #fffaf4; }
.star-option__stars { display: flex; justify-content: center; gap: 0; min-height: 30rpx; }
.star-option__label { font-size: 20rpx; font-weight: 700; }
.star-option__points { font-size: 18rpx; opacity: .76; }
.optional-label { margin-left: auto; color: #898e91; font-size: 20rpx; font-weight: 500; }
.field-footer { display: flex; justify-content: space-between; gap: 16rpx; margin-top: 8rpx; color: #858a8e; font-size: 20rpx; }
.field-footer--danger { color: #9a5145; }
.flow-notice { display: flex; align-items: flex-start; gap: 12rpx; margin: 4rpx 0 24rpx; padding: 17rpx 18rpx; border-radius: 14rpx; background: #ebeae5; color: #62696e; font-size: 21rpx; line-height: 1.5; }
.unavailable-notice { display: flex; align-items: flex-start; gap: 14rpx; padding: 22rpx; border: 1rpx solid #d9d8d2; border-radius: 18rpx; background: #ebeae5; }
.unavailable-notice text:first-child { display: block; color: #3e454b; font-size: 24rpx; font-weight: 730; }
.unavailable-notice text:last-child { display: block; margin-top: 5rpx; color: #70767a; font-size: 21rpx; line-height: 1.5; }
@media (max-width: 350px) {
  .star-option__label { font-size: 18rpx; }
  .scope-context { align-items: flex-start; }
}
</style>
