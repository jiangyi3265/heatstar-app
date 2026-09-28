<template>
  <view class="page-shell">
    <AppHeader
      title="积分中心"
      subtitle="星级积分与季度排名"
      action-icon="info-circle"
      action-label="查看计分规则"
      @action="showRules = !showRules"
    />

    <view class="page-body page-body--tabbed">
      <view class="context-line">
        <view class="context-line__copy">
          <AppIcon name="calendar" :size="34" tone="accent" />
          <text>{{ quarterLabel }}</text>
        </view>
        <text class="demo-mark">服务器实时核算</text>
      </view>

      <view v-if="showRules" class="rule-panel surface">
        <view class="rule-panel__head">
          <view>
            <text class="rule-panel__title">积分核算口径</text>
            <text class="rule-panel__copy">每月 {{ rules.cutoffDay }} 日为统计截止日，截止日前完成评审小组终审并采纳的提案计入当月。</text>
          </view>
          <button class="icon-button" aria-label="关闭计分规则" @tap="showRules = false">
            <AppIcon name="x" :size="34" tone="muted" />
          </button>
        </view>
        <view class="coefficient-row">
          <view v-for="item in coefficientItems" :key="item.stars" class="coefficient-item">
            <text class="coefficient-item__star">{{ item.stars }} 星</text>
            <text class="coefficient-item__point">{{ item.points }} 分</text>
          </view>
        </view>
        <text class="rule-panel__foot">审核在截止日后完成的提案顺延至次月，不重复计分。</text>
      </view>

      <view class="view-switch" aria-label="积分视图">
        <button :class="['view-switch__item', { active: activeView === 'month' }]" @tap="activeView = 'month'">月度积分</button>
        <button :class="['view-switch__item', { active: activeView === 'quarter' }]" @tap="activeView = 'quarter'">季度积分</button>
        <button :class="['view-switch__item', { active: activeView === 'participation' }]" @tap="activeView = 'participation'">参与贡献</button>
      </view>

      <template v-if="activeView === 'month'">
        <view class="month-toolbar">
          <view>
            <text class="eyebrow">个人月度积分</text>
            <text class="toolbar-note">评审小组采纳后自动入账</text>
          </view>
          <picker :range="months" range-key="label" :value="selectedMonthIndex" @change="changeMonth">
            <view class="period-picker">
              <text>{{ selectedMonth.label }}</text>
              <AppIcon name="chevron-down" :size="28" tone="muted" />
            </view>
          </picker>
        </view>

        <view class="score-sheet surface">
          <view class="score-sheet__top">
            <view class="score-person">
              <view class="avatar">{{ (user.name || '').slice(0, 1) }}</view>
              <view>
                <text class="score-person__name">{{ user.name }}</text>
                <text class="score-person__meta">{{ user.team }} · 工号 {{ user.workNo }}</text>
              </view>
            </view>
            <view class="settled-score">
              <text class="settled-score__value mono-number">{{ monthTotal }}</text>
              <text class="settled-score__unit">已入账积分</text>
            </view>
          </view>

          <view class="cutoff-note">
            <AppIcon name="clock" :size="32" tone="soft" />
            <text>{{ selectedMonth.shortLabel }} {{ rules.cutoffDay }} 日 24:00 截止，当前共 {{ includedRecords.length }} 项计入</text>
          </view>

          <view v-if="currentMonthRecords.length" class="ledger">
            <view v-for="record in currentMonthRecords" :key="record.id" class="ledger-row">
              <view class="ledger-row__main">
                <view class="ledger-row__titleline">
                  <text class="ledger-row__title">{{ record.title }}</text>
                  <StatusTag
                    :label="record.included ? '已计入' : '顺延'"
                    :status="record.included ? 'approved' : 'pending_cutoff'"
                  />
                </view>
                <view class="ledger-row__meta">
                  <text>{{ record.approvedAt.slice(5) }} 审核通过</text>
                  <text>·</text>
                  <text>{{ record.stars }} 星提案</text>
                </view>
              </view>
              <text :class="['ledger-row__score', { muted: !record.included }]">{{ record.included ? '+' : '' }}{{ record.included ? scoreFor(record.stars) : 0 }}</text>
            </view>
          </view>
          <view v-else class="empty-state compact-empty">
            <AppIcon name="clipboard-check" :size="54" tone="muted" />
            <text class="empty-state__title">本月暂无入账记录</text>
            <text class="empty-state__text">提案完成评审后，积分明细会自动出现在这里。</text>
          </view>

          <view class="equation-row">
            <text>核算结果</text>
            <text class="mono-number">{{ equationText }} = {{ monthTotal }} 分</text>
          </view>
        </view>

        <view class="section-block">
          <view class="section-heading">
            <view>
              <text class="section-title">本月个人排名</text>
              <text class="section-subtitle">按截止日内已采纳积分降序</text>
            </view>
            <text class="ranking-scope">全厂</text>
          </view>
          <view class="ranking-list surface">
            <view v-for="person in monthlyRanking" :key="person.rank" class="ranking-row" :class="{ mine: person.name === user.name }">
              <text class="ranking-row__rank mono-number">{{ String(person.rank).padStart(2, '0') }}</text>
              <view class="ranking-row__person">
                <text class="ranking-row__name">{{ person.name }}</text>
                <text class="ranking-row__team">{{ person.team }}</text>
              </view>
              <text class="ranking-row__points mono-number">{{ person.points }} 分</text>
            </view>
          </view>
        </view>
      </template>

      <template v-else-if="activeView === 'quarter'">
        <view class="quarter-intro">
          <view>
            <text class="eyebrow">{{ quarterLabel }}</text>
            <text class="toolbar-note">{{ quarterRangeText }}</text>
          </view>
          <StatusTag label="核算中" status="pending_quarter" />
        </view>

        <view class="quarter-summary surface">
          <view class="quarter-summary__line">
            <view>
              <text class="quarter-summary__label">我的季度积分</text>
              <text class="quarter-summary__value mono-number">{{ myQuarterPoints }} 分</text>
            </view>
            <view class="quarter-rank">
              <text class="quarter-rank__label">全厂排名</text>
              <text class="quarter-rank__value mono-number">{{ myQuarterRank }}</text>
            </view>
          </view>
          <view class="month-bars">
            <view v-for="item in quarterMonths" :key="item.label" class="month-bar">
              <view class="month-bar__labels">
                <text>{{ item.label }}</text>
                <text class="mono-number">{{ item.points }} 分</text>
              </view>
              <view class="month-bar__track"><view class="month-bar__fill" :style="{ width: `${Math.min(item.points / 10 * 100, 100)}%` }" /></view>
            </view>
          </view>
        </view>

        <view class="section-block">
          <view class="section-heading">
            <view>
              <text class="section-title">个人季度积分</text>
              <text class="section-subtitle">同分时按三星提案数、通过时间排序</text>
            </view>
          </view>
          <view class="ranking-list surface">
            <view v-for="person in quarterRanking" :key="person.rank" class="ranking-row" :class="{ mine: person.name === user.name }">
              <text class="ranking-row__rank mono-number">{{ person.rank }}</text>
              <view class="ranking-row__person">
                <text class="ranking-row__name">{{ person.name }}</text>
                <text class="ranking-row__team">{{ person.team }}</text>
              </view>
              <text class="ranking-row__points mono-number">{{ person.points }} 分</text>
            </view>
          </view>
        </view>

        <view class="section-block">
          <view class="section-heading">
            <view>
              <text class="section-title">班组季度积分</text>
              <text class="section-subtitle">积分按采纳结果核算，参与率包含第一作者与团队成员</text>
            </view>
          </view>
          <scroll-view scroll-x class="table-scroll">
            <view class="team-table surface">
              <view class="team-table__row team-table__head">
                <text>班组</text><text>总积分</text><text>人均</text><text>参与率</text>
              </view>
              <view v-for="team in teamRankingData" :key="team.rank" class="team-table__row">
                <view class="team-name"><text class="team-rank">{{ team.rank }}</text><text>{{ team.name }}</text></view>
                <text class="mono-number">{{ team.total }}</text>
                <text class="mono-number emphasis">{{ team.average }}</text>
                <text class="mono-number">{{ team.participation }}%</text>
              </view>
            </view>
          </scroll-view>
        </view>
      </template>

      <template v-else>
        <view class="quarter-intro contribution-intro">
          <view>
            <text class="eyebrow">季度参与贡献</text>
            <text class="toolbar-note">统计本季度正式提交的项目，仅团队成员计入参与榜</text>
          </view>
          <text class="ranking-scope">{{ quarterCompactLabel }}</text>
        </view>

        <view class="participation-overview surface">
          <view class="participation-overview__copy">
            <text class="participation-overview__eyebrow">全车间参与概况</text>
            <text class="participation-overview__statement">
              {{ factoryParticipation.participants }} 名团队成员参与 {{ factoryParticipation.projectCount }} 项改善，覆盖全员 {{ factoryParticipation.participation }}%
            </text>
          </view>
          <view class="participation-overview__facts">
            <view>
              <text class="mono-number">{{ factoryParticipation.participants }}/{{ factoryParticipation.members }}</text>
              <text>团队成员</text>
            </view>
            <view>
              <text class="mono-number">{{ factoryParticipation.supportOnly }}</text>
              <text>协作骨干</text>
            </view>
          </view>
          <view class="participation-track" aria-label="全车间参与率">
            <view class="participation-track__fill" :style="{ width: `${factoryParticipation.participation}%` }" />
          </view>
          <text class="participation-overview__note">第一作者不进入参与榜。统计包含审核中、已采纳和已驳回的正式提报，不计草稿，也不改变积分归属。</text>
        </view>

        <view class="section-block contribution-block">
          <view class="section-heading section-heading--stacked">
            <view>
              <text class="section-title">人员参与榜</text>
              <text class="section-subtitle">只统计团队成员，按协作项目数排序，同项目重复姓名只计一次</text>
            </view>
            <view class="scope-switch" aria-label="人员参与榜范围">
              <button
                v-for="scope in participationScopes"
                :key="scope.value"
                :class="['scope-switch__item', { active: participationScope === scope.value }]"
                @tap="participationScope = scope.value"
              >{{ scope.label }}</button>
            </view>
          </view>

          <view v-if="visibleParticipationRows.length" class="contributor-list surface">
            <view
              v-for="person in visibleParticipationRows"
              :key="`${participationScope}-${person.name}`"
              :class="['contributor-row', { mine: person.name === user.name, 'support-star': person.supportOnly }]"
            >
              <text class="contributor-row__rank mono-number">{{ String(person.scopeRank).padStart(2, '0') }}</text>
              <view class="contributor-avatar">{{ person.name.slice(0, 1) }}</view>
              <view class="contributor-row__main">
                <view class="contributor-row__title">
                  <text class="contributor-row__name">{{ person.name }}</text>
                  <text v-if="person.badge" :class="['contributor-badge', { support: person.supportOnly }]">{{ person.badge }}</text>
                </view>
                <text class="contributor-row__meta">{{ person.team }} · {{ person.section }}</text>
                <view class="contributor-row__breakdown">
                  <text>团队协作 {{ person.supportCount }}</text>
                </view>
              </view>
              <view class="contributor-row__total">
                <text class="mono-number">{{ person.projectCount }}</text>
                <text>参与项目</text>
              </view>
            </view>
          </view>
          <view v-else class="empty-state compact-empty surface">
            <AppIcon name="users" :size="54" tone="muted" />
            <text class="empty-state__title">当前范围暂无参与记录</text>
            <text class="empty-state__text">提交提案并登记团队成员后，这里会自动形成贡献排名。</text>
          </view>
        </view>

        <view class="section-block">
          <view class="section-heading section-heading--stacked">
            <view>
              <text class="section-title">组织参与率</text>
              <text class="section-subtitle">参与人数除以组织人数，按比例从高到低排列</text>
            </view>
            <view class="scope-switch scope-switch--compact" aria-label="组织参与率范围">
              <button :class="['scope-switch__item', { active: organizationScope === 'team' }]" @tap="organizationScope = 'team'">班组</button>
              <button :class="['scope-switch__item', { active: organizationScope === 'section' }]" @tap="organizationScope = 'section'">工段</button>
            </view>
          </view>
          <view class="organization-list surface">
            <view v-for="item in visibleOrganizationRows" :key="`${organizationScope}-${item.name}`" class="organization-row">
              <text class="organization-row__rank mono-number">{{ item.rank }}</text>
              <view class="organization-row__main">
                <view class="organization-row__line">
                  <text class="organization-row__name">{{ item.name }}</text>
                  <text class="organization-row__rate mono-number">{{ item.participation }}%</text>
                </view>
                <text class="organization-row__meta">{{ item.participants }}/{{ item.members }} 人参与 · {{ item.projectCount }} 项改善</text>
                <view class="organization-track"><view class="organization-track__fill" :style="{ width: `${item.participation}%` }" /></view>
              </view>
            </view>
          </view>
        </view>
      </template>

      <view class="section-block">
        <view class="section-heading">
          <view>
            <text class="section-title">季度评优</text>
            <text class="section-subtitle">分享记录、候选判定与发布结果全程可追溯</text>
          </view>
        </view>
        <view class="feature-list surface">
          <button v-for="item in featureLinks" :key="item.url" class="feature-row" @tap="go(item.url)">
            <view class="feature-row__icon"><AppIcon :name="item.icon" :size="38" /></view>
            <view class="feature-row__copy">
              <text class="feature-row__title">{{ item.title }}</text>
              <text class="feature-row__desc">{{ item.desc }}</text>
            </view>
            <AppIcon name="chevron-right" :size="30" tone="muted" />
          </button>
        </view>
      </view>
    </view>

    <AppTabbar current="points" />
  </view>
</template>

<script>
import AppHeader from '../../components/AppHeader.vue'
import AppIcon from '../../components/AppIcon.vue'
import AppTabbar from '../../components/AppTabbar.vue'
import StatusTag from '../../components/StatusTag.vue'
import { pointRules } from '../../utils/mock.js'
import { currentUser } from '../../utils/session.js'
import { getProposals, readStorage, STORAGE_KEYS } from '../../utils/storage.js'
import { ensureSynchronized } from '../../utils/api.js'
import { quarterOf, recentMonths } from '../../utils/stats.js'
import { buildOrganizationParticipation } from '../../utils/participation.js'
import { departmentId } from '../../utils/organization.js'

export default {
  components: { AppHeader, AppIcon, AppTabbar, StatusTag },
  data() {
    return {
      activeView: 'month',
      showRules: false,
      selectedMonthIndex: 0,
      user: { ...(currentUser() || {}) },
      rules: { ...pointRules },
      months: recentMonths(3),
      scoreRecords: [],
      quarterMonths: [],
      monthlyRanking: [],
      quarterRanking: [],
      teamRankingData: [],
      participationScope: 'factory',
      organizationScope: 'team',
      participationRows: [],
      teamParticipationData: [],
      sectionParticipationData: [],
      factoryParticipation: { participants: 0, members: 0, projectCount: 0, supportOnly: 0, participation: 0 },
      participationScopes: [
        { value: 'team', label: '本班组' },
        { value: 'section', label: '本工段' },
        { value: 'factory', label: '全车间' }
      ],
      featureLinks: [
        { title: '分享会记录', desc: '登记签到与案例附件', icon: 'share-2', url: '/pages/points/sharing' },
        { title: '候选自动判定', desc: '逐项核验门槛与合规熔断', icon: 'user-star', url: '/pages/points/candidates' },
        { title: '评选结果', desc: '光荣榜、流动红旗与历史归档', icon: 'trophy', url: '/pages/points/results' }
      ]
    }
  },
  computed: {
    quarterLabel() {
      return quarterOf().label
    },
    quarterCompactLabel() {
      return quarterOf().compactLabel
    },
    quarterRangeText() {
      const labels = this.quarterMonths.map(item => String(item.label).replace(/\s/g, ''))
      return labels.length === 3 ? `${labels[0]}至${labels[2]}月度积分自动汇总` : '本季度月度积分自动汇总'
    },
    myQuarterRow() {
      return this.quarterRanking.find(item => item.name === this.user.name) || null
    },
    myQuarterPoints() {
      return this.myQuarterRow ? this.myQuarterRow.points : 0
    },
    myQuarterRank() {
      return this.myQuarterRow ? String(this.myQuarterRow.rank).padStart(2, '0') : '—'
    },
    selectedMonth() {
      return this.months[this.selectedMonthIndex] || this.months[0]
    },
    currentMonthRecords() {
      return this.scoreRecords.filter(item => item.month === this.selectedMonth.value)
    },
    includedRecords() {
      return this.currentMonthRecords.filter(item => item.included)
    },
    monthTotal() {
      return this.includedRecords.reduce((total, item) => total + this.scoreFor(item.stars), 0)
    },
    coefficientItems() {
      return [
        { stars: 1, points: this.rules.oneStar },
        { stars: 2, points: this.rules.twoStar },
        { stars: 3, points: this.rules.threeStar }
      ]
    },
    equationText() {
      if (!this.includedRecords.length) return '暂无计分项'
      return this.includedRecords.map(item => `${item.stars} 星 × ${this.scoreFor(item.stars)}`).join(' + ')
    },
    visibleParticipationRows() {
      const rows = this.participationRows.filter(item => {
        if (this.participationScope === 'team') return item.team === this.user.team
        if (this.participationScope === 'section') return item.section === this.user.section
        return true
      })
      return rows.map((item, index) => ({ ...item, scopeRank: index + 1 }))
    },
    visibleOrganizationRows() {
      return this.organizationScope === 'section' ? this.sectionParticipationData : this.teamParticipationData
    }
  },
  async onShow() {
    await ensureSynchronized()
    this.user = { ...(currentUser() || {}) }
    const settings = readStorage(STORAGE_KEYS.settings, {}) || {}
    const storedRules = settings.pointRules || settings.points || settings
    this.rules = {
      oneStar: Number(storedRules.oneStar) || pointRules.oneStar,
      twoStar: Number(storedRules.twoStar) || pointRules.twoStar,
      threeStar: Number(storedRules.threeStar) || pointRules.threeStar,
      cutoffDay: Number(storedRules.cutoffDay) || pointRules.cutoffDay
    }
    this.rebuildLedger()
  },
  methods: {
    scoreFor(stars) {
      if (Number(stars) === 3) return Number(this.rules.threeStar)
      if (Number(stars) === 2) return Number(this.rules.twoStar)
      return Number(this.rules.oneStar)
    },
    datePart(proposal) {
      return String(proposal.reviewedAt || proposal.submittedAt || '').slice(0, 10)
    },
    countingMonth(dateText) {
      const match = String(dateText).match(/^(\d{4})-(\d{2})-(\d{2})/)
      if (!match) return ''
      const date = new Date(Number(match[1]), Number(match[2]) - 1, 1)
      if (Number(match[3]) > Number(this.rules.cutoffDay)) date.setMonth(date.getMonth() + 1)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    },
    rebuildLedger() {
      const proposals = getProposals().filter(item => departmentId(item) === departmentId(this.user))
      const approved = proposals.filter(item => item.status === 'approved' && Number(item.stars) > 0)
      const people = readStorage(STORAGE_KEYS.people, []).filter(item => departmentId(item) === departmentId(this.user))
      const teams = readStorage(STORAGE_KEYS.teams, []).filter(item => departmentId(item) === departmentId(this.user))
      const enriched = approved.map(item => {
        const approvedAt = this.datePart(item)
        const accountingMonth = this.countingMonth(approvedAt)
        return { ...item, approvedAt, accountingMonth, score: this.scoreFor(item.stars) }
      })
      this.scoreRecords = enriched.filter(item => item.firstAuthor === this.user.name).map(item => ({
        id: item.id,
        month: item.accountingMonth,
        title: item.title,
        approvedAt: item.approvedAt,
        stars: item.stars,
        included: true
      }))
      this.rebuildRankings(enriched, people, teams, proposals)
    },
    rebuildRankings(enriched, people, teams, proposals) {
      const month = this.selectedMonth.value
      const [year, monthNumber] = month.split('-').map(Number)
      const quarterStart = Math.floor((monthNumber - 1) / 3) * 3 + 1
      const quarterKeys = [0, 1, 2].map(offset => `${year}-${String(quarterStart + offset).padStart(2, '0')}`)
      const personRows = source => {
        const totals = new Map(people.map(item => [item.name, { name: item.name, team: item.team, points: 0 }]))
        source.forEach(item => {
          const row = totals.get(item.firstAuthor) || { name: item.firstAuthor || '未登记', team: item.team || '未登记', points: 0 }
          row.points += item.score
          totals.set(row.name, row)
        })
        return Array.from(totals.values()).filter(item => item.points > 0).sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, 'zh-CN')).map((item, index) => ({ ...item, rank: index + 1 }))
      }
      this.monthlyRanking = personRows(enriched.filter(item => item.accountingMonth === month))
      const quarterItems = enriched.filter(item => quarterKeys.includes(item.accountingMonth))
      const activityItems = proposals.filter(item => {
        const monthKey = String(item.submittedAt || item.discoverDate || '').slice(0, 7)
        return quarterKeys.includes(monthKey) && !['draft', 'withdrawn'].includes(String(item.status || ''))
      })
      const participation = buildOrganizationParticipation(activityItems, people, teams)
      this.participationRows = participation.people
      this.teamParticipationData = participation.teams
      this.sectionParticipationData = participation.sections
      this.factoryParticipation = participation.factory
      this.quarterRanking = personRows(quarterItems)
      this.quarterMonths = quarterKeys.map(key => ({
        label: `${Number(key.slice(5))} 月`,
        points: quarterItems.filter(item => item.accountingMonth === key && item.firstAuthor === this.user.name).reduce((total, item) => total + item.score, 0)
      }))
      this.teamRankingData = teams.map(team => {
        const teamItems = quarterItems.filter(item => item.team === team.name)
        const total = teamItems.reduce((sum, item) => sum + item.score, 0)
        const members = Math.max(1, Number(team.members || people.filter(person => person.team === team.name).length || 1))
        const activity = participation.teams.find(item => item.name === team.name)
        return {
          name: team.name,
          total,
          average: Number((total / members).toFixed(1)),
          participation: activity ? activity.participation : 0,
          projectCount: activity ? activity.projectCount : 0
        }
      }).filter(item => item.total > 0 || item.projectCount > 0).sort((a, b) => b.average - a.average || b.total - a.total || b.participation - a.participation).map((item, index) => ({ ...item, rank: index + 1 }))
    },
    changeMonth(event) {
      this.selectedMonthIndex = Number(event.detail.value)
      this.rebuildLedger()
    },
    go(url) {
      uni.navigateTo({ url })
    }
  }
}
</script>

<style scoped>
.context-line { display: flex; align-items: center; justify-content: space-between; gap: 20rpx; margin-bottom: 20rpx; color: #5e666c; font-size: 23rpx; }
.context-line__copy { display: flex; align-items: center; gap: 10rpx; font-weight: 650; }
.demo-mark { color: #858a8e; font-size: 21rpx; }
.rule-panel { margin-bottom: 20rpx; padding: 26rpx; background: #f8f0e7; border-color: #e4d1be; }
.rule-panel__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 20rpx; }
.rule-panel__title { display: block; color: #30373d; font-size: 28rpx; font-weight: 750; }
.rule-panel__copy { display: block; margin-top: 8rpx; color: #6d6258; font-size: 23rpx; line-height: 1.6; }
.rule-panel__foot { display: block; margin-top: 16rpx; color: #7b7066; font-size: 21rpx; line-height: 1.5; }
.icon-button { display: flex; width: 64rpx; height: 64rpx; flex: 0 0 64rpx; align-items: center; justify-content: center; border-radius: 50%; }
.icon-button:active { background: #eee1d5; }
.coefficient-row { display: grid; grid-template-columns: repeat(3, 1fr); margin-top: 22rpx; border: 1rpx solid #dfcbbb; border-radius: 14rpx; overflow: hidden; }
.coefficient-item { display: flex; min-height: 72rpx; align-items: center; justify-content: center; gap: 8rpx; border-right: 1rpx solid #dfcbbb; }
.coefficient-item:last-child { border-right: 0; }
.coefficient-item__star { color: #6c5c4f; font-size: 22rpx; }
.coefficient-item__point { color: #9f321f; font-size: 25rpx; font-weight: 750; }
.view-switch { display: grid; grid-template-columns: repeat(3, 1fr); padding: 6rpx; border: 1rpx solid #d9d8d2; border-radius: 18rpx; background: #e9e8e3; }
.view-switch__item { min-height: 70rpx; border-radius: 13rpx; color: #6e7479; font-size: 24rpx; font-weight: 650; }
.view-switch__item.active { background: #fbfaf7; color: #20262d; box-shadow: 0 3rpx 10rpx rgba(38, 49, 58, .08); }
.month-toolbar, .quarter-intro { display: flex; align-items: flex-end; justify-content: space-between; gap: 24rpx; margin: 30rpx 2rpx 18rpx; }
.eyebrow { display: block; color: #20262d; font-size: 30rpx; font-weight: 750; }
.toolbar-note { display: block; margin-top: 7rpx; color: #7a8084; font-size: 22rpx; }
.period-picker { display: flex; min-height: 64rpx; align-items: center; gap: 8rpx; padding: 0 18rpx; border: 1rpx solid #d5d4ce; border-radius: 14rpx; background: #fbfaf7; color: #3b4248; font-size: 23rpx; font-weight: 650; }
.score-sheet { overflow: hidden; }
.score-sheet__top { display: flex; align-items: center; justify-content: space-between; gap: 20rpx; padding: 28rpx; }
.score-person { display: flex; min-width: 0; align-items: center; gap: 16rpx; }
.avatar { display: flex; width: 76rpx; height: 76rpx; flex: 0 0 76rpx; align-items: center; justify-content: center; border-radius: 22rpx 22rpx 22rpx 8rpx; background: #303a42; color: #faf7f1; font-size: 30rpx; font-weight: 800; }
.score-person__name { display: block; color: #20262d; font-size: 29rpx; font-weight: 750; }
.score-person__meta { display: block; margin-top: 6rpx; color: #7b8185; font-size: 21rpx; }
.settled-score { flex: 0 0 auto; text-align: right; }
.settled-score__value { display: block; color: #a93322; font-size: 52rpx; font-weight: 800; line-height: 1; }
.settled-score__unit { display: block; margin-top: 7rpx; color: #7b8185; font-size: 20rpx; }
.cutoff-note { display: flex; min-height: 72rpx; align-items: center; gap: 12rpx; padding: 0 28rpx; background: #eeede8; color: #62696e; font-size: 22rpx; }
.ledger { padding: 0 28rpx; }
.ledger-row { display: flex; min-height: 116rpx; align-items: center; gap: 20rpx; border-bottom: 1rpx solid #e3e2dd; }
.ledger-row:last-child { border-bottom: 0; }
.ledger-row__main { min-width: 0; flex: 1; }
.ledger-row__titleline { display: flex; min-width: 0; align-items: center; gap: 12rpx; }
.ledger-row__title { overflow: hidden; min-width: 0; flex: 1; color: #2e353b; font-size: 25rpx; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
.ledger-row__meta { display: flex; gap: 9rpx; margin-top: 8rpx; color: #858a8e; font-size: 21rpx; }
.ledger-row__score { color: #9f321f; font-size: 29rpx; font-weight: 800; }
.ledger-row__score.muted { color: #919598; }
.compact-empty { padding: 52rpx 28rpx; }
.equation-row { display: flex; align-items: center; justify-content: space-between; gap: 18rpx; padding: 22rpx 28rpx; border-top: 1rpx solid #deddd7; background: #f6f4ef; color: #646b70; font-size: 22rpx; }
.equation-row text:last-child { color: #30373d; font-weight: 700; text-align: right; }
.ranking-scope { padding: 7rpx 14rpx; border-radius: 999rpx; background: #e7e6e1; color: #6e7478; font-size: 21rpx; }
.ranking-list { overflow: hidden; }
.ranking-row { display: flex; min-height: 94rpx; align-items: center; gap: 18rpx; padding: 0 24rpx; border-bottom: 1rpx solid #e3e2dd; }
.ranking-row:last-child { border-bottom: 0; }
.ranking-row.mine { background: #f8ebe7; }
.ranking-row__rank { width: 46rpx; color: #929699; font-size: 23rpx; font-weight: 750; }
.ranking-row:nth-child(-n+3) .ranking-row__rank { color: #a33a28; }
.ranking-row__person { min-width: 0; flex: 1; }
.ranking-row__name { display: block; color: #2a3137; font-size: 26rpx; font-weight: 700; }
.ranking-row__team { display: block; margin-top: 4rpx; color: #858a8e; font-size: 20rpx; }
.ranking-row__points { color: #30383e; font-size: 26rpx; font-weight: 750; }
.quarter-summary { padding: 28rpx; }
.quarter-summary__line { display: flex; align-items: flex-start; justify-content: space-between; padding-bottom: 26rpx; border-bottom: 1rpx solid #e0dfda; }
.quarter-summary__label, .quarter-rank__label { display: block; color: #72787c; font-size: 22rpx; }
.quarter-summary__value { display: block; margin-top: 8rpx; color: #9e3221; font-size: 40rpx; font-weight: 800; }
.quarter-rank { text-align: right; }
.quarter-rank__value { display: block; margin-top: 6rpx; color: #2b3339; font-size: 36rpx; font-weight: 800; }
.month-bars { padding-top: 24rpx; }
.month-bar + .month-bar { margin-top: 18rpx; }
.month-bar__labels { display: flex; justify-content: space-between; margin-bottom: 9rpx; color: #596167; font-size: 22rpx; }
.month-bar__track { height: 10rpx; overflow: hidden; border-radius: 999rpx; background: #e2e1dc; }
.month-bar__fill { height: 100%; border-radius: 999rpx; background: #b43b28; transition: width 220ms ease-out; }
.table-scroll { width: 100%; }
.team-table { min-width: 690rpx; overflow: hidden; }
.team-table__row { display: grid; min-height: 86rpx; grid-template-columns: 1.45fr .75fr .65fr .8fr; align-items: center; padding: 0 24rpx; border-bottom: 1rpx solid #e3e2dd; color: #555d63; font-size: 23rpx; }
.team-table__row:last-child { border-bottom: 0; }
.team-table__head { min-height: 70rpx; background: #eae9e4; color: #73797d; font-size: 21rpx; font-weight: 650; }
.team-name { display: flex; align-items: center; gap: 10rpx; color: #2f363c; font-weight: 650; }
.team-rank { color: #a23a29; font-size: 20rpx; }
.emphasis { color: #9f321f; font-weight: 750; }
.contribution-intro { align-items: center; }
.participation-overview { padding: 28rpx; }
.participation-overview__eyebrow { display: block; color: #72787c; font-size: 21rpx; font-weight: 650; }
.participation-overview__statement { display: block; max-width: 26em; margin-top: 10rpx; color: #242c32; font-size: 30rpx; font-weight: 750; line-height: 1.45; }
.participation-overview__facts { display: grid; grid-template-columns: repeat(2, 1fr); margin-top: 26rpx; border-top: 1rpx solid #deddd7; border-bottom: 1rpx solid #deddd7; }
.participation-overview__facts view { display: flex; min-height: 88rpx; align-items: center; justify-content: space-between; padding: 0 18rpx; color: #747b7f; font-size: 21rpx; }
.participation-overview__facts view + view { border-left: 1rpx solid #deddd7; }
.participation-overview__facts .mono-number { color: #30383e; font-size: 28rpx; font-weight: 800; }
.participation-track { height: 12rpx; margin-top: 24rpx; overflow: hidden; border-radius: 999rpx; background: #dfded9; }
.participation-track__fill { height: 100%; border-radius: 999rpx; background: #287253; transition: width 220ms ease-out; }
.participation-overview__note { display: block; margin-top: 14rpx; color: #737a7e; font-size: 21rpx; line-height: 1.55; }
.contribution-block { margin-top: 36rpx; }
.section-heading--stacked { flex-wrap: wrap; align-items: flex-end; gap: 20rpx; }
.scope-switch { display: flex; flex: 0 0 auto; padding: 5rpx; border: 1rpx solid #dad9d3; border-radius: 14rpx; background: #e9e8e3; }
.scope-switch__item { min-width: 100rpx; min-height: 58rpx; padding: 0 15rpx; border-radius: 10rpx; color: #72787c; font-size: 21rpx; font-weight: 650; }
.scope-switch__item.active { background: #fbfaf7; color: #922d20; }
.scope-switch--compact .scope-switch__item { min-width: 94rpx; }
.contributor-list { overflow: hidden; }
.contributor-row { display: flex; min-height: 132rpx; align-items: center; gap: 14rpx; padding: 18rpx 22rpx; border-bottom: 1rpx solid #e2e1dc; }
.contributor-row:last-child { border-bottom: 0; }
.contributor-row.mine { background: #f8ebe7; }
.contributor-row.support-star { background: #edf3ef; }
.contributor-row.support-star.mine { background: #f1ece5; }
.contributor-row__rank { width: 42rpx; flex: 0 0 42rpx; color: #919699; font-size: 22rpx; font-weight: 750; }
.contributor-row:nth-child(-n+3) .contributor-row__rank { color: #9a3424; }
.contributor-avatar { display: flex; width: 62rpx; height: 62rpx; flex: 0 0 62rpx; align-items: center; justify-content: center; border-radius: 18rpx 18rpx 18rpx 6rpx; background: #e3e1da; color: #3c454b; font-size: 25rpx; font-weight: 800; }
.support-star .contributor-avatar { background: #dbe9e0; color: #225f45; }
.contributor-row__main { min-width: 0; flex: 1; }
.contributor-row__title { display: flex; min-width: 0; align-items: center; gap: 10rpx; }
.contributor-row__name { overflow: hidden; color: #283137; font-size: 26rpx; font-weight: 750; text-overflow: ellipsis; white-space: nowrap; }
.contributor-badge { flex: 0 0 auto; padding: 4rpx 10rpx; border-radius: 999rpx; background: #eee6dc; color: #86512c; font-size: 18rpx; font-weight: 700; }
.contributor-badge.support { background: #dcebe2; color: #246346; }
.contributor-row__meta { display: block; margin-top: 5rpx; color: #858a8e; font-size: 19rpx; }
.contributor-row__breakdown { display: flex; flex-wrap: wrap; gap: 14rpx; margin-top: 8rpx; color: #636b70; font-size: 20rpx; }
.contributor-row__total { flex: 0 0 auto; text-align: right; }
.contributor-row__total .mono-number { display: block; color: #293239; font-size: 33rpx; font-weight: 800; line-height: 1; }
.contributor-row__total text:last-child { display: block; margin-top: 6rpx; color: #858a8e; font-size: 18rpx; }
.organization-list { overflow: hidden; }
.organization-row { display: flex; min-height: 118rpx; align-items: flex-start; gap: 16rpx; padding: 22rpx 24rpx; border-bottom: 1rpx solid #e2e1dc; }
.organization-row:last-child { border-bottom: 0; }
.organization-row__rank { width: 34rpx; flex: 0 0 34rpx; padding-top: 2rpx; color: #919699; font-size: 21rpx; font-weight: 750; }
.organization-row:nth-child(-n+3) .organization-row__rank { color: #9a3424; }
.organization-row__main { min-width: 0; flex: 1; }
.organization-row__line { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; }
.organization-row__name { color: #2c343a; font-size: 25rpx; font-weight: 700; }
.organization-row__rate { color: #287253; font-size: 25rpx; font-weight: 800; }
.organization-row__meta { display: block; margin-top: 5rpx; color: #7d8387; font-size: 20rpx; }
.organization-track { height: 8rpx; margin-top: 12rpx; overflow: hidden; border-radius: 999rpx; background: #e1e0db; }
.organization-track__fill { height: 100%; border-radius: 999rpx; background: #4e7564; transition: width 220ms ease-out; }
.feature-list { overflow: hidden; }
.feature-row { display: flex; width: 100%; min-height: 112rpx; align-items: center; gap: 18rpx; padding: 0 22rpx; border-bottom: 1rpx solid #e1e0db; text-align: left; }
.feature-row:last-child { border-bottom: 0; }
.feature-row:active { background: #efeee9; }
.feature-row__icon { display: flex; width: 70rpx; height: 70rpx; flex: 0 0 70rpx; align-items: center; justify-content: center; border-radius: 18rpx; background: #ece4dc; }
.feature-row__copy { min-width: 0; flex: 1; }
.feature-row__title { display: block; color: #293137; font-size: 26rpx; font-weight: 700; }
.feature-row__desc { display: block; margin-top: 5rpx; color: #7d8387; font-size: 21rpx; }
</style>
