<template>
  <view class="page-shell">
    <AppHeader
      title="候选名单"
      subtitle="自动筛选与人工确认"
      :back="true"
      action-icon="history"
      action-label="查看调整记录"
      @action="showAudit = !showAudit"
    />

    <view class="page-body candidates-body">
      <view class="quarter-head">
        <view>
          <text class="quarter-head__title">{{ quarterLabel }}</text>
          <text class="quarter-head__subtitle">规则版本 2026.07 · 结果随积分自动更新</text>
        </view>
        <view class="auto-badge"><AppIcon name="refresh" :size="28" tone="inverse" /><text>自动判定</text></view>
      </view>

      <view class="status-summary surface">
        <view class="status-summary__item">
          <text class="status-summary__value mono-number">{{ autoEligibleCount }}</text>
          <text>自动符合</text>
        </view>
        <view class="status-summary__item">
          <text class="status-summary__value mono-number">{{ confirmedCount }}</text>
          <text>人工确认</text>
        </view>
        <view class="status-summary__item danger">
          <text class="status-summary__value mono-number">{{ blockedCount }}</text>
          <text>合规熔断</text>
        </view>
      </view>

      <view v-if="showAudit" class="audit-panel surface">
        <view class="audit-panel__head">
          <view>
            <text class="audit-panel__title">人工调整记录</text>
            <text class="audit-panel__subtitle">保留调整人、结论、原因与时间</text>
          </view>
          <button class="close-button" aria-label="关闭调整记录" @tap="showAudit = false"><AppIcon name="x" :size="32" tone="muted" /></button>
        </view>
        <view v-if="auditLogs.length" class="audit-list">
          <view v-for="log in auditLogs" :key="log.id" class="audit-row">
            <view class="audit-row__mark"><AppIcon name="clipboard-check" :size="30" /></view>
            <view class="audit-row__copy">
              <text>{{ log.target }} · {{ decisionLabel(log.decision) }}</text>
              <text>{{ log.reason || '自动符合项直接确认' }}</text>
              <text>{{ log.operator }} · {{ log.time }}</text>
            </view>
          </view>
        </view>
        <view v-else class="empty-audit">暂无人工调整记录</view>
      </view>

      <view class="type-switch">
        <button :class="['type-switch__item', { active: activeType === 'person' }]" @tap="switchType('person')">
          <AppIcon name="user-star" :size="32" :tone="activeType === 'person' ? 'accent' : 'muted'" />
          <text>精益之星</text>
        </button>
        <button :class="['type-switch__item', { active: activeType === 'team' }]" @tap="switchType('team')">
          <AppIcon name="flag" :size="32" :tone="activeType === 'team' ? 'accent' : 'muted'" />
          <text>精益班组</text>
        </button>
      </view>

      <view class="rule-brief surface">
        <view class="rule-brief__icon"><AppIcon :name="activeType === 'person' ? 'user-star' : 'users'" :size="38" /></view>
        <view class="rule-brief__copy">
          <text>{{ activeType === 'person' ? '个人候选门槛' : '班组候选门槛' }}</text>
          <text>{{ activeType === 'person' ? '积分 ≥15，三星 ≥1，本人签到 ≥2，无合规熔断' : '人均 ≥8，有当季精益之星，分享 ≥3，参与率 ≥50%，无合规熔断' }}</text>
        </view>
      </view>

      <view class="section-heading candidate-heading">
        <view>
          <text class="section-title">{{ activeType === 'person' ? '个人判定明细' : '班组判定明细' }}</text>
          <text class="section-subtitle">每项规则独立展示，全部通过才进入人工确认</text>
        </view>
        <text class="candidate-count">{{ activeCandidates.length }} 项</text>
      </view>

      <view class="candidate-list">
        <view v-for="item in activeCandidates" :key="item.id" class="candidate-card surface">
          <view class="candidate-card__head">
            <view :class="['identity-mark', { team: activeType === 'team' }]">
              <text v-if="activeType === 'person'">{{ item.name.slice(0, 1) }}</text>
              <AppIcon v-else name="users" :size="36" tone="inverse" />
            </view>
            <view class="candidate-name">
              <text>{{ item.name }}</text>
              <text v-if="activeType === 'person'">{{ item.department || '热处理厂' }} · {{ item.team }} · 工号 {{ item.workNo }}</text>
              <text v-else>{{ item.department || '热处理厂' }} · 季度总积分 {{ item.total }} · 人均 {{ item.average }}</text>
            </view>
            <StatusTag
              :label="automaticEligible(item) ? '自动符合' : '暂不符合'"
              :status="automaticEligible(item) ? 'eligible' : 'ineligible'"
            />
          </view>

          <view v-if="!item.compliance" class="fuse-alert">
            <view class="fuse-alert__icon"><AppIcon name="shield-lock" :size="34" tone="inverse" /></view>
            <view>
              <text>合规熔断已触发</text>
              <text>{{ item.complianceReason || '存在有效期内合规事件，本季度不得进入候选名单。' }}</text>
            </view>
          </view>

          <view class="rule-list">
            <view v-for="rule in rulesFor(item)" :key="rule.key" :class="['rule-row', { passed: rule.passed }]">
              <view class="rule-row__state">
                <AppIcon :name="rule.passed ? 'circle-check' : 'circle-x'" :size="32" />
              </view>
              <view class="rule-row__copy">
                <text>{{ rule.label }}</text>
                <text>{{ rule.detail }}</text>
              </view>
              <text class="rule-row__result">{{ rule.passed ? '通过' : '未通过' }}</text>
            </view>
          </view>

          <view class="manual-line">
            <view>
              <text class="manual-line__label">人工结论</text>
              <text :class="['manual-line__value', decisionTone(item.manualStatus)]">{{ manualLabel(item) }}</text>
            </view>
            <button class="btn btn--small btn--secondary" @tap="openAdjustment(item)">
              <AppIcon name="adjustments-horizontal" :size="28" />
              {{ item.manualStatus === 'pending' ? '人工确认' : '调整结论' }}
            </button>
          </view>

          <view v-if="editingId === item.id" class="adjustment-panel">
            <text class="adjustment-panel__title">设置人工结论</text>
            <view class="decision-options">
              <button
                :class="['decision-option', { active: adjustment.decision === 'confirmed' }]"
                :disabled="!item.compliance"
                @tap="adjustment.decision = 'confirmed'"
              >确认为候选</button>
              <button
                :class="['decision-option', { active: adjustment.decision === 'excluded' }]"
                @tap="adjustment.decision = 'excluded'"
              >不列入候选</button>
              <button
                :class="['decision-option', { active: adjustment.decision === 'pending' }]"
                @tap="adjustment.decision = 'pending'"
              >恢复待确认</button>
            </view>
            <view class="field-group adjustment-reason">
              <text class="field-label">调整原因<text v-if="requiresReason(item)" class="field-required"> *</text></text>
              <textarea v-model="adjustment.reason" class="textarea-control" maxlength="120" placeholder="自动结果被改变时必须说明原因" />
              <text class="field-hint">合规熔断为硬条件，人工确认不能绕过。</text>
            </view>
            <view v-if="adjustmentError" class="adjustment-error">
              <AppIcon name="alert-triangle" :size="28" />
              <text>{{ adjustmentError }}</text>
            </view>
            <view class="button-row">
              <button class="btn btn--small btn--secondary" @tap="cancelAdjustment">取消</button>
              <button class="btn btn--small btn--primary" @tap="saveAdjustment(item)">保存结论</button>
            </view>
          </view>
        </view>
      </view>

      <view class="publish-entry surface">
        <view class="publish-entry__copy">
          <AppIcon name="trophy" :size="36" />
          <view>
            <text>已确认 {{ confirmedPeopleCount }} 人、{{ confirmedTeamsCount }} 个班组</text>
            <text>确认完成后可预览并发布本季度评选结果</text>
          </view>
        </view>
        <button class="btn btn--dark btn--block" @tap="goResults">
          查看发布预览
          <AppIcon name="chevron-right" :size="30" tone="inverse" />
        </button>
      </view>
    </view>
  </view>
</template>

<script>
import AppHeader from '../../components/AppHeader.vue'
import AppIcon from '../../components/AppIcon.vue'
import StatusTag from '../../components/StatusTag.vue'
import { pointRules } from '../../utils/mock.js'
import { getProposals, readStorage, writeStorage, STORAGE_KEYS, formatNow } from '../../utils/storage.js'
import { ensureSynchronized } from '../../utils/api.js'
import { currentUser } from '../../utils/session.js'
import { quarterOf } from '../../utils/stats.js'
import { proposalParticipants } from '../../utils/participation.js'
import { personalShareCount } from '../../utils/sharing.js'
import { departmentId, departmentName } from '../../utils/organization.js'
import { isMine } from '../../utils/stats.js'

export default {
  components: { AppHeader, AppIcon, StatusTag },
  data() {
    return {
      activeType: 'person',
      showAudit: false,
      people: [],
      teamCandidates: [],
      auditLogs: [],
      editingId: '',
      adjustmentError: '',
      adjustment: { decision: 'pending', reason: '' }
    }
  },
  computed: {
    quarterLabel() {
      return quarterOf().label
    },
    activeCandidates() {
      return this.activeType === 'person' ? this.people : this.teamCandidates
    },
    allCandidates() {
      return [...this.people, ...this.teamCandidates]
    },
    autoEligibleCount() {
      return this.allCandidates.filter(item => this.automaticEligible(item)).length
    },
    confirmedCount() {
      return this.allCandidates.filter(item => item.compliance && item.manualStatus === 'confirmed').length
    },
    blockedCount() {
      return this.allCandidates.filter(item => !item.compliance).length
    },
    confirmedPeopleCount() {
      return this.people.filter(item => item.compliance && item.manualStatus === 'confirmed').length
    },
    confirmedTeamsCount() {
      return this.teamCandidates.filter(item => item.compliance && item.manualStatus === 'confirmed').length
    }
  },
  async onShow() {
    await ensureSynchronized()
    this.loadCandidates()
  },
  methods: {
    seedItem(item) {
      return {
        ...item,
        manualStatus: item.manualStatus || (item.confirmed ? 'confirmed' : 'pending'),
        manualReason: item.manualReason || ''
      }
    },
    mergeById(seed, stored) {
      const local = new Map()
      ;(Array.isArray(stored) ? stored : []).forEach(item => {
        if (item.id) local.set(`id:${item.id}`, item)
        if (item.workNo) local.set(`work:${item.workNo}`, item)
        if (item.name) local.set(`name:${departmentId(item)}:${item.name}`, item)
      })
      return seed.map(item => {
        const saved = local.get(`id:${item.id}`) || local.get(`work:${item.workNo}`) || local.get(`name:${departmentId(item)}:${item.name}`) || {}
        return this.seedItem({ ...item, compliance: saved.compliance ?? item.compliance, complianceReason: saved.complianceReason ?? item.complianceReason, manualStatus: saved.manualStatus, manualReason: saved.manualReason, confirmed: saved.confirmed })
      })
    },
    loadCandidates() {
      const now = new Date()
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3
      const start = `${now.getFullYear()}-${String(quarterStartMonth + 1).padStart(2, '0')}-01`
      const endDate = new Date(now.getFullYear(), quarterStartMonth + 3, 0)
      const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`
      const people = readStorage(STORAGE_KEYS.people, []).filter(item => item.status !== '离岗')
      const teams = readStorage(STORAGE_KEYS.teams, [])
      const settings = readStorage(STORAGE_KEYS.settings, {}) || {}
      const score = stars => Number(stars) === 3 ? Number(settings.threeStar || pointRules.threeStar) : Number(stars) === 2 ? Number(settings.twoStar || pointRules.twoStar) : Number(settings.oneStar || pointRules.oneStar)
      const approved = getProposals().filter(item => {
        const date = String(item.reviewedAt || item.submittedAt || '').slice(0, 10)
        return item.status === 'approved' && date >= start && date <= end
      })
      const shares = readStorage(STORAGE_KEYS.shares, []).filter(item => String(item.date || '') >= start && String(item.date || '') <= end)
      const basePeople = people.map(person => {
        const items = approved.filter(item => departmentId(item) === departmentId(person) && isMine(item, person))
        return {
          id: `C-${person.workNo}`,
          name: person.name,
          workNo: person.workNo,
          departmentId: departmentId(person),
          department: departmentName(person),
          team: person.team,
          points: items.reduce((total, item) => total + score(item.stars), 0),
          threeStar: items.filter(item => Number(item.stars) === 3).length,
          shares: personalShareCount(shares, person),
          compliance: person.compliance !== false,
          complianceReason: person.complianceReason || '',
          eligible: false,
          confirmed: false
        }
      })
      const autoStarTeams = new Set(basePeople.filter(item => Number(item.points) >= 15 && Number(item.threeStar) >= 1 && Number(item.shares) >= 2 && item.compliance).map(item => `${departmentId(item)}:${item.team}`))
      const baseTeams = teams.map(team => {
        const teamItems = approved.filter(item => departmentId(item) === departmentId(team) && item.team === team.name)
        const members = Math.max(1, Number(team.members || people.filter(person => departmentId(person) === departmentId(team) && person.team === team.name).length || 1))
        const total = teamItems.reduce((sum, item) => sum + score(item.stars), 0)
        const participantNames = new Set()
        teamItems.forEach(item => proposalParticipants(item).filter(person => person.role === 'support').forEach(person => participantNames.add(person.name)))
        return {
          id: `CT-${team.id}`,
          name: team.name,
          departmentId: departmentId(team),
          department: departmentName(team),
          total,
          average: Number((total / members).toFixed(1)),
          hasStar: autoStarTeams.has(`${departmentId(team)}:${team.name}`),
          shares: shares.filter(item => departmentId(item) === departmentId(team) && item.team === team.name).length,
          participation: Math.min(100, Math.round(participantNames.size / members * 100)),
          compliance: team.compliance !== false,
          complianceReason: team.complianceReason || '',
          eligible: false,
          confirmed: false
        }
      })
      const stored = readStorage(STORAGE_KEYS.candidates, null)
      if (stored && !Array.isArray(stored)) {
        this.people = this.mergeById(basePeople, stored.people)
        this.teamCandidates = this.mergeById(baseTeams, stored.teams)
        this.auditLogs = Array.isArray(stored.logs) ? stored.logs : []
      } else if (Array.isArray(stored)) {
        this.people = this.mergeById(basePeople, stored.filter(item => !String(item.id).startsWith('CT')))
        this.teamCandidates = this.mergeById(baseTeams, stored.filter(item => String(item.id).startsWith('CT')))
        this.auditLogs = []
      } else {
        this.people = basePeople.map(item => this.seedItem(item))
        this.teamCandidates = baseTeams.map(item => this.seedItem(item))
        this.auditLogs = []
      }
    },
    persistCandidates() {
      writeStorage(STORAGE_KEYS.candidates, {
        version: 1,
        people: this.people,
        teams: this.teamCandidates,
        logs: this.auditLogs,
        updatedAt: formatNow()
      })
    },
    switchType(type) {
      this.activeType = type
      this.cancelAdjustment()
    },
    personRules(item) {
      return [
        { key: 'points', label: '季度积分 ≥ 15 分', detail: `当前 ${item.points} 分`, passed: Number(item.points) >= 15 },
        { key: 'threeStar', label: '至少 1 个三星提案', detail: `当前 ${item.threeStar} 个`, passed: Number(item.threeStar) >= 1 },
        { key: 'shares', label: '本人签到分享会 ≥ 2 次', detail: `当前 ${item.shares} 次`, passed: Number(item.shares) >= 2 },
        { key: 'compliance', label: '无合规熔断', detail: item.compliance ? '未触发' : '已触发', passed: Boolean(item.compliance) }
      ]
    },
    teamRules(item) {
      return [
        { key: 'average', label: '人均积分 ≥ 8 分', detail: `当前 ${item.average} 分`, passed: Number(item.average) >= 8 },
        { key: 'hasStar', label: '有当季精益之星', detail: item.hasStar ? '已有个人候选' : '暂无个人候选', passed: Boolean(item.hasStar) },
        { key: 'shares', label: '分享会 ≥ 3 次', detail: `当前 ${item.shares} 次`, passed: Number(item.shares) >= 3 },
        { key: 'participation', label: '成员参与率 ≥ 50%', detail: `当前 ${item.participation}%`, passed: Number(item.participation) >= 50 },
        { key: 'compliance', label: '无合规熔断', detail: item.compliance ? '未触发' : '已触发', passed: Boolean(item.compliance) }
      ]
    },
    rulesFor(item) {
      return String(item.id).startsWith('CT') ? this.teamRules(item) : this.personRules(item)
    },
    automaticEligible(item) {
      return this.rulesFor(item).every(rule => rule.passed)
    },
    manualLabel(item) {
      if (!item.compliance) return '熔断锁定，不列入'
      if (item.manualStatus === 'confirmed') return '已确认为候选'
      if (item.manualStatus === 'excluded') return '人工调整为不列入'
      return '待人工确认'
    },
    decisionTone(status) {
      if (status === 'confirmed') return 'success'
      if (status === 'excluded') return 'danger'
      return 'pending'
    },
    decisionLabel(decision) {
      if (decision === 'confirmed') return '确认为候选'
      if (decision === 'excluded') return '不列入候选'
      return '恢复待确认'
    },
    openAdjustment(item) {
      this.editingId = item.id
      this.adjustment = { decision: item.manualStatus || 'pending', reason: item.manualReason || '' }
      this.adjustmentError = ''
    },
    cancelAdjustment() {
      this.editingId = ''
      this.adjustmentError = ''
      this.adjustment = { decision: 'pending', reason: '' }
    },
    requiresReason(item) {
      const decisionEligible = this.adjustment.decision === 'confirmed'
      return this.adjustment.decision !== 'pending' && decisionEligible !== this.automaticEligible(item)
    },
    saveAdjustment(item) {
      if (!item.compliance && this.adjustment.decision === 'confirmed') {
        this.adjustmentError = '该候选已触发合规熔断，不能人工确认为候选。'
        return
      }
      if (this.requiresReason(item) && !this.adjustment.reason.trim()) {
        this.adjustmentError = '人工结论与自动判定不一致，请填写调整原因。'
        return
      }
      item.manualStatus = this.adjustment.decision
      item.manualReason = this.adjustment.reason.trim()
      item.confirmed = item.manualStatus === 'confirmed' && item.compliance
      this.auditLogs.unshift({
        id: `CA-${Date.now()}`,
        target: item.name,
        decision: item.manualStatus,
        reason: item.manualReason,
        operator: (currentUser() || {}).name || '管理员',
        time: formatNow()
      })
      this.auditLogs = this.auditLogs.slice(0, 30)
      this.persistCandidates()
      this.cancelAdjustment()
      uni.showToast({ title: '人工结论已保存', icon: 'success' })
    },
    goResults() {
      uni.navigateTo({ url: '/pages/points/results' })
    }
  }
}
</script>

<style scoped>
.candidates-body { padding-bottom: calc(70rpx + env(safe-area-inset-bottom)); }
.quarter-head { display: flex; align-items: center; justify-content: space-between; gap: 20rpx; }
.quarter-head__title { display: block; color: #222a30; font-size: 30rpx; font-weight: 780; }
.quarter-head__subtitle { display: block; margin-top: 7rpx; color: #7e8488; font-size: 21rpx; }
.auto-badge { display: flex; min-height: 54rpx; align-items: center; gap: 7rpx; padding: 0 15rpx; border-radius: 999rpx; background: #303a42; color: #f7f5ef; font-size: 20rpx; font-weight: 700; }
.status-summary { display: grid; grid-template-columns: repeat(3, 1fr); margin-top: 22rpx; overflow: hidden; }
.status-summary__item { display: flex; min-height: 116rpx; flex-direction: column; align-items: center; justify-content: center; border-right: 1rpx solid #deddd7; color: #777d81; font-size: 20rpx; }
.status-summary__item:last-child { border-right: 0; }
.status-summary__value { margin-bottom: 7rpx; color: #30383e; font-size: 34rpx; font-weight: 800; }
.status-summary__item.danger .status-summary__value { color: #a93625; }
.audit-panel { margin-top: 20rpx; overflow: hidden; }
.audit-panel__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 18rpx; padding: 22rpx 24rpx; border-bottom: 1rpx solid #e0dfda; background: #ecebe6; }
.audit-panel__title { display: block; color: #2b3339; font-size: 26rpx; font-weight: 730; }
.audit-panel__subtitle { display: block; margin-top: 5rpx; color: #7e8488; font-size: 20rpx; }
.close-button { display: flex; width: 58rpx; height: 58rpx; align-items: center; justify-content: center; border-radius: 50%; }
.audit-list { max-height: 450rpx; overflow-y: auto; padding: 0 24rpx; }
.audit-row { display: flex; gap: 14rpx; padding: 20rpx 0; border-bottom: 1rpx solid #e1e0db; }
.audit-row:last-child { border-bottom: 0; }
.audit-row__mark { display: flex; width: 54rpx; height: 54rpx; flex: 0 0 54rpx; align-items: center; justify-content: center; border-radius: 14rpx; background: #e7e1da; }
.audit-row__copy { min-width: 0; flex: 1; }
.audit-row__copy text { display: block; }
.audit-row__copy text:first-child { color: #32393f; font-size: 23rpx; font-weight: 680; }
.audit-row__copy text:nth-child(2) { margin-top: 5rpx; color: #6f767a; font-size: 21rpx; line-height: 1.45; }
.audit-row__copy text:last-child { margin-top: 6rpx; color: #969a9d; font-size: 19rpx; }
.empty-audit { padding: 44rpx; color: #888d90; font-size: 22rpx; text-align: center; }
.type-switch { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6rpx; margin-top: 24rpx; padding: 6rpx; border: 1rpx solid #d9d8d2; border-radius: 18rpx; background: #e9e8e3; }
.type-switch__item { display: flex; min-height: 76rpx; align-items: center; justify-content: center; gap: 9rpx; border-radius: 13rpx; color: #6b7277; font-size: 25rpx; font-weight: 680; }
.type-switch__item.active { background: #fbfaf7; color: #2b3339; box-shadow: 0 3rpx 10rpx rgba(38, 49, 58, .08); }
.rule-brief { display: flex; align-items: flex-start; gap: 16rpx; margin-top: 20rpx; padding: 20rpx; background: #f7f1e9; border-color: #e4d6c7; }
.rule-brief__icon { display: flex; width: 62rpx; height: 62rpx; flex: 0 0 62rpx; align-items: center; justify-content: center; border-radius: 16rpx; background: #e9ddd1; }
.rule-brief__copy { min-width: 0; flex: 1; }
.rule-brief__copy text:first-child { display: block; color: #554b43; font-size: 24rpx; font-weight: 720; }
.rule-brief__copy text:last-child { display: block; margin-top: 6rpx; color: #756b62; font-size: 20rpx; line-height: 1.55; }
.candidate-heading { margin-top: 30rpx; }
.candidate-count { padding: 7rpx 14rpx; border-radius: 999rpx; background: #e8e7e2; color: #6d7478; font-size: 20rpx; }
.candidate-list { display: grid; gap: 20rpx; }
.candidate-card { overflow: hidden; }
.candidate-card__head { display: flex; align-items: center; gap: 15rpx; padding: 22rpx; }
.identity-mark { display: flex; width: 70rpx; height: 70rpx; flex: 0 0 70rpx; align-items: center; justify-content: center; border-radius: 20rpx 20rpx 20rpx 7rpx; background: #303a42; color: #f8f5ef; font-size: 27rpx; font-weight: 800; }
.identity-mark.team { background: #814336; }
.candidate-name { min-width: 0; flex: 1; }
.candidate-name text:first-child { display: block; color: #273036; font-size: 27rpx; font-weight: 750; }
.candidate-name text:last-child { display: block; margin-top: 5rpx; color: #7e8488; font-size: 20rpx; }
.fuse-alert { display: flex; align-items: flex-start; gap: 13rpx; margin: 0 22rpx 16rpx; padding: 16rpx; border-radius: 15rpx; background: #f7ded9; color: #8f2d20; }
.fuse-alert__icon { display: flex; width: 52rpx; height: 52rpx; flex: 0 0 52rpx; align-items: center; justify-content: center; border-radius: 14rpx; background: #a83b2a; }
.fuse-alert text { display: block; }
.fuse-alert text:first-child { font-size: 23rpx; font-weight: 750; }
.fuse-alert text:last-child { margin-top: 4rpx; font-size: 20rpx; line-height: 1.45; }
.rule-list { padding: 0 22rpx; }
.rule-row { display: flex; min-height: 88rpx; align-items: center; gap: 13rpx; border-top: 1rpx solid #e2e1dc; }
.rule-row__state { display: flex; width: 48rpx; height: 48rpx; flex: 0 0 48rpx; align-items: center; justify-content: center; border-radius: 50%; background: #f6e6e2; filter: sepia(.15) saturate(1.1); }
.rule-row.passed .rule-row__state { background: #e5f0e9; }
.rule-row__copy { min-width: 0; flex: 1; }
.rule-row__copy text:first-child { display: block; color: #343b41; font-size: 23rpx; font-weight: 650; }
.rule-row__copy text:last-child { display: block; margin-top: 4rpx; color: #858a8e; font-size: 20rpx; }
.rule-row__result { color: #a13727; font-size: 21rpx; font-weight: 700; }
.rule-row.passed .rule-row__result { color: #347054; }
.manual-line { display: flex; min-height: 92rpx; align-items: center; justify-content: space-between; gap: 16rpx; margin-top: 8rpx; padding: 12rpx 22rpx; border-top: 1rpx solid #deddd7; background: #f3f2ed; }
.manual-line__label { display: block; color: #7c8286; font-size: 19rpx; }
.manual-line__value { display: block; margin-top: 4rpx; font-size: 22rpx; font-weight: 700; }
.manual-line__value.success { color: #28684c; }
.manual-line__value.danger { color: #9e3122; }
.manual-line__value.pending { color: #8b5e1e; }
.adjustment-panel { padding: 22rpx; border-top: 1rpx solid #deddd7; background: #f8f7f3; }
.adjustment-panel__title { display: block; color: #333a40; font-size: 24rpx; font-weight: 700; }
.decision-options { display: grid; grid-template-columns: repeat(3, 1fr); gap: 9rpx; margin-top: 15rpx; }
.decision-option { min-height: 68rpx; padding: 0 8rpx; border: 1rpx solid #d0cfc9; border-radius: 13rpx; background: #fbfaf7; color: #646b70; font-size: 21rpx; font-weight: 650; }
.decision-option.active { border-color: #a73b2a; background: #f6e3de; color: #922d1f; }
.decision-option[disabled] { opacity: .38; }
.adjustment-reason { margin-top: 20rpx; }
.adjustment-reason .textarea-control { min-height: 132rpx; font-size: 24rpx; }
.adjustment-error { display: flex; align-items: flex-start; gap: 9rpx; margin-bottom: 18rpx; padding: 14rpx; border-radius: 12rpx; background: #f8e1dc; color: #9c3022; font-size: 21rpx; line-height: 1.45; }
.adjustment-panel .button-row .btn { flex: 1; }
.publish-entry { margin-top: 28rpx; padding: 22rpx; }
.publish-entry__copy { display: flex; align-items: center; gap: 15rpx; margin-bottom: 18rpx; }
.publish-entry__copy text { display: block; }
.publish-entry__copy text:first-child { color: #2d353b; font-size: 24rpx; font-weight: 700; }
.publish-entry__copy text:last-child { margin-top: 5rpx; color: #7f8589; font-size: 20rpx; line-height: 1.45; }
</style>
