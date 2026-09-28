<template>
  <view class="page-shell">
    <AppHeader
      title="评选结果"
      subtitle="光荣榜与历史归档"
      :back="true"
      action-icon="archive"
      action-label="切换历史归档"
      @action="activeView = activeView === 'honor' ? 'history' : 'honor'"
    />

    <view class="page-body">
      <view class="view-tabs">
        <button :class="['view-tabs__item', { active: activeView === 'honor' }]" @tap="activeView = 'honor'">本季发布</button>
        <button :class="['view-tabs__item', { active: activeView === 'history' }]" @tap="activeView = 'history'">历史归档</button>
      </view>

      <template v-if="activeView === 'honor'">
        <view class="release-status surface">
          <view class="release-status__top">
            <view>
              <text class="release-status__quarter">{{ currentQuarter }}</text>
              <text class="release-status__desc">{{ currentResult ? `发布于 ${currentResult.publishedAt}` : '候选名单确认后生成发布预览' }}</text>
            </view>
            <StatusTag :label="currentResult ? '已发布' : '待发布'" :status="currentResult ? 'published' : 'pending_publish'" />
          </view>
          <view class="release-flow">
            <view class="release-step done"><view class="release-step__dot"><AppIcon name="check" :size="22" tone="inverse" /></view><text>自动筛选</text></view>
            <view class="release-line done" />
            <view class="release-step done"><view class="release-step__dot"><AppIcon name="check" :size="22" tone="inverse" /></view><text>人工确认</text></view>
            <view :class="['release-line', { done: currentResult }]" />
            <view :class="['release-step', { done: currentResult }]">
              <view class="release-step__dot"><AppIcon :name="currentResult ? 'check' : 'clock'" :size="22" :tone="currentResult ? 'inverse' : 'muted'" /></view>
              <text>结果发布</text>
            </view>
          </view>
        </view>

        <view v-if="displayResult.stars.length" class="honor-board">
          <view class="honor-board__masthead">
            <view class="honor-board__emblem"><AppIcon name="medal" :size="46" tone="inverse" /></view>
            <view>
              <text class="honor-board__title">精益之星光荣榜</text>
              <text class="honor-board__subtitle">{{ currentResult ? '正式发布名单' : '候选确认名单预览' }}</text>
            </view>
            <text v-if="!currentResult" class="preview-stamp">预览</text>
          </view>

          <view class="honor-list">
            <view v-for="(star, index) in displayResult.stars" :key="star.id || star.name" class="honor-person">
              <view :class="['honor-person__rank', `rank-${Math.min(index + 1, 3)}`]">
                <text>{{ String(index + 1).padStart(2, '0') }}</text>
              </view>
              <view class="honor-person__copy">
                <view class="honor-person__line">
                  <text class="honor-person__name">{{ star.name }}</text>
                  <text class="honor-person__team">{{ star.team }}</text>
                </view>
                <text class="honor-person__highlight">{{ star.highlight || '季度精益改善实践' }}</text>
              </view>
              <view class="honor-person__points">
                <text class="mono-number">{{ star.points }}</text>
                <text>积分</text>
              </view>
            </view>
          </view>
        </view>

        <view v-else class="empty-state surface result-empty">
          <AppIcon name="user-star" :size="66" tone="muted" />
          <text class="empty-state__title">尚无已确认的个人候选</text>
          <text class="empty-state__text">请先在候选名单中完成人工确认，再生成光荣榜。</text>
          <button class="btn btn--small btn--secondary empty-action" @tap="goCandidates">前往候选名单</button>
        </view>

        <view v-if="displayResult.team" class="flag-award surface">
          <view class="flag-award__flag">
            <AppIcon name="flag" :size="48" tone="inverse" />
            <text>流动红旗</text>
          </view>
          <view class="flag-award__content">
            <text class="flag-award__eyebrow">季度精益班组</text>
            <text class="flag-award__name">{{ displayResult.team.name }}</text>
            <view class="flag-award__metrics">
              <view><text class="mono-number">{{ displayResult.team.average }}</text><text>人均积分</text></view>
              <view><text class="mono-number">{{ displayResult.team.participation }}%</text><text>成员参与率</text></view>
              <view><text class="mono-number">{{ displayResult.team.shares }}</text><text>分享场次</text></view>
            </view>
          </view>
        </view>

        <view v-else class="team-missing surface">
          <AppIcon name="flag" :size="40" tone="muted" />
          <view><text>暂无已确认的班组候选</text><text>流动红旗需至少确认 1 个符合条件的班组。</text></view>
        </view>

        <view class="publish-note">
          <AppIcon name="speakerphone" :size="32" tone="soft" />
          <text>发布后将进入服务器历史归档，并同步用于员工端和小程序光荣榜展示。</text>
        </view>

        <button v-if="!currentResult" class="btn btn--primary btn--block publish-button" :disabled="!publishReady" @tap="publishResult">
          <AppIcon name="speakerphone" :size="34" tone="inverse" />
          发布本季度结果
        </button>
        <view v-else class="published-receipt surface">
          <view class="published-receipt__icon"><AppIcon name="circle-check" :size="40" /></view>
          <view>
            <text>评选结果已正式发布</text>
            <text>发布人：{{ currentResult.publisher || '管理员' }} · {{ currentResult.publishedAt }}</text>
          </view>
          <button class="link-text" @tap="activeView = 'history'">查看归档</button>
        </view>
      </template>

      <template v-else>
        <view class="archive-intro">
          <view>
            <text class="archive-intro__title">历史评选归档</text>
            <text class="archive-intro__subtitle">按季度查询历届精益之星与流动红旗班组</text>
          </view>
          <text class="archive-count">{{ archiveResults.length }} 期</text>
        </view>

        <view class="archive-tools surface">
          <view class="search-control">
            <AppIcon name="search" :size="32" tone="muted" />
            <input v-model="archiveQuery" confirm-type="search" placeholder="搜索姓名或班组" />
            <button v-if="archiveQuery" class="clear-search" aria-label="清空搜索" @tap="archiveQuery = ''"><AppIcon name="x" :size="28" tone="muted" /></button>
          </view>
          <picker :range="yearOptions" :value="yearIndex" @change="yearIndex = Number($event.detail.value)">
            <view class="year-picker">
              <AppIcon name="calendar" :size="30" tone="soft" />
              <text>{{ yearOptions[yearIndex] }}</text>
              <AppIcon name="chevron-down" :size="26" tone="muted" />
            </view>
          </picker>
        </view>

        <view v-if="archiveResults.length" class="archive-list">
          <view v-for="record in archiveResults" :key="record.quarter" class="archive-card surface">
            <button class="archive-card__summary" @tap="toggleArchive(record.quarter)">
              <view class="archive-card__year"><text>{{ record.quarter.slice(0, 5) }}</text><text>{{ quarterShort(record.quarter) }}</text></view>
              <view class="archive-card__copy">
                <text>{{ record.quarter }}</text>
                <text>精益之星 {{ record.star }} · {{ record.team }}</text>
              </view>
              <StatusTag :label="record.status" :status="record.status === '已发布' ? 'published' : 'neutral'" />
              <AppIcon :name="expandedQuarter === record.quarter ? 'chevron-down' : 'chevron-right'" :size="28" tone="muted" />
            </button>

            <view v-if="expandedQuarter === record.quarter" class="archive-card__detail">
              <view class="archive-detail__line">
                <text>精益之星</text>
                <text>{{ record.star }}</text>
              </view>
              <view class="archive-detail__line">
                <text>流动红旗</text>
                <text>{{ record.team }}</text>
              </view>
              <view class="archive-detail__line">
                <text>发布时间</text>
                <text>{{ record.publishedAt || '季度结束后归档' }}</text>
              </view>
              <view class="archive-detail__line">
                <text>发布状态</text>
                <text>{{ record.status }}</text>
              </view>
            </view>
          </view>
        </view>

        <view v-else class="empty-state surface">
          <AppIcon name="archive" :size="62" tone="muted" />
          <text class="empty-state__title">没有匹配的归档记录</text>
          <text class="empty-state__text">请调整年份或搜索关键词后重试。</text>
        </view>
      </template>
    </view>
  </view>
</template>

<script>
import AppHeader from '../../components/AppHeader.vue'
import AppIcon from '../../components/AppIcon.vue'
import StatusTag from '../../components/StatusTag.vue'
import { readStorage, writeStorage, STORAGE_KEYS, formatNow, getProposals } from '../../utils/storage.js'
import { ensureSynchronized } from '../../utils/api.js'
import { currentUser } from '../../utils/session.js'
import { quarterOf } from '../../utils/stats.js'

const RESULTS_KEY = 'heatstar_honor_results'

/** 代表案例取本人星级最高、最近一次被采纳的提案标题。 */
function bestProposalTitle(name, proposals) {
  const mine = proposals.filter(item => item.firstAuthor === name && item.status === 'approved' && Number(item.stars) > 0)
  if (!mine.length) return ''
  const best = mine.sort((a, b) => {
    const byStars = Number(b.stars) - Number(a.stars)
    if (byStars) return byStars
    return String(b.reviewedAt || b.submittedAt || '').localeCompare(String(a.reviewedAt || a.submittedAt || ''))
  })[0]
  return best.title || ''
}

export default {
  components: { AppHeader, AppIcon, StatusTag },
  data() {
    return {
      activeView: 'honor',
      currentQuarter: quarterOf().compactLabel,
      resultRecords: [],
      confirmedPeople: [],
      confirmedTeams: [],
      archiveQuery: '',
      yearOptions: ['全部年份', '2026 年', '2025 年'],
      yearIndex: 0,
      expandedQuarter: ''
    }
  },
  computed: {
    currentResult() {
      return this.resultRecords.find(item => item.quarter === this.currentQuarter) || null
    },
    previewResult() {
      const proposals = getProposals()
      const stars = [...this.confirmedPeople]
        .sort((a, b) => Number(b.points) - Number(a.points))
        .map((item, index) => ({
          id: item.id,
          rank: index + 1,
          name: item.name,
          team: item.team,
          points: Number(item.points),
          highlight: item.highlight || bestProposalTitle(item.name, proposals) || '季度精益改善实践'
        }))
      const team = [...this.confirmedTeams].sort((a, b) => Number(b.average) - Number(a.average))[0] || null
      return { quarter: this.currentQuarter, stars, team }
    },
    displayResult() {
      return this.currentResult || this.previewResult
    },
    publishReady() {
      return this.previewResult.stars.length > 0 && Boolean(this.previewResult.team)
    },
    archiveRows() {
      const saved = this.resultRecords.map(item => ({
        quarter: item.quarter,
        star: item.stars.map(star => star.name).join('、'),
        team: item.team ? item.team.name : '未评出',
        status: '已发布',
        publishedAt: item.publishedAt
      }))
      // 只列真正发布过的季度，不再混入演示用的历史样例
      const byQuarter = new Map()
      saved.forEach(item => byQuarter.set(item.quarter, item))
      return Array.from(byQuarter.values()).sort((a, b) => b.quarter.localeCompare(a.quarter, 'zh-CN'))
    },
    archiveResults() {
      const query = this.archiveQuery.trim().toLowerCase()
      const year = this.yearIndex === 0 ? '' : this.yearOptions[this.yearIndex].slice(0, 4)
      return this.archiveRows.filter(item => {
        const matchesYear = !year || item.quarter.startsWith(year)
        const haystack = `${item.quarter} ${item.star} ${item.team}`.toLowerCase()
        return matchesYear && (!query || haystack.includes(query))
      })
    }
  },
  async onShow() {
    await ensureSynchronized()
    this.loadData()
  },
  methods: {
    loadData() {
      const storedResults = readStorage(RESULTS_KEY, [])
      this.resultRecords = Array.isArray(storedResults) ? storedResults : []

      const storedCandidates = readStorage(STORAGE_KEYS.candidates, null)
      let people = []
      let teams = []
      if (storedCandidates && !Array.isArray(storedCandidates)) {
        people = Array.isArray(storedCandidates.people) ? storedCandidates.people : people
        teams = Array.isArray(storedCandidates.teams) ? storedCandidates.teams : teams
      } else if (Array.isArray(storedCandidates)) {
        people = storedCandidates.filter(item => !String(item.id).startsWith('CT'))
        teams = storedCandidates.filter(item => String(item.id).startsWith('CT'))
      }
      this.confirmedPeople = people.filter(item => item.compliance !== false && (item.manualStatus === 'confirmed' || (!item.manualStatus && item.confirmed)))
      this.confirmedTeams = teams.filter(item => item.compliance !== false && (item.manualStatus === 'confirmed' || (!item.manualStatus && item.confirmed)))
    },
    publishResult() {
      if (!this.publishReady) {
        uni.showToast({ title: '请先确认个人与班组候选', icon: 'none' })
        return
      }
      uni.showModal({
        title: '发布评选结果',
        content: `将发布 ${this.previewResult.stars.length} 名精益之星和 ${this.previewResult.team.name} 流动红旗，发布后进入历史归档。`,
        confirmText: '确认发布',
        confirmColor: '#b93c28',
        success: result => {
          if (!result.confirm) return
          const published = {
            quarter: this.currentQuarter,
            publishedAt: formatNow(),
            publisher: (currentUser() || {}).name || '管理员',
            stars: this.previewResult.stars,
            team: this.previewResult.team
          }
          this.resultRecords = [published, ...this.resultRecords.filter(item => item.quarter !== this.currentQuarter)]
          writeStorage(RESULTS_KEY, this.resultRecords)
          uni.showToast({ title: '评选结果已发布', icon: 'success' })
        }
      })
    },
    goCandidates() {
      uni.navigateTo({ url: '/pages/points/candidates' })
    },
    toggleArchive(quarter) {
      this.expandedQuarter = this.expandedQuarter === quarter ? '' : quarter
    },
    quarterShort(quarter) {
      const value = String(quarter)
      const start = value.indexOf('第')
      const end = value.indexOf('季度')
      return start >= 0 && end > start ? `${value.slice(start, end)}季` : '季度'
    }
  }
}
</script>

<style scoped>
.view-tabs { display: grid; grid-template-columns: repeat(2, 1fr); padding: 6rpx; border: 1rpx solid #d9d8d2; border-radius: 18rpx; background: #e9e8e3; }
.view-tabs__item { min-height: 70rpx; border-radius: 13rpx; color: #6f757a; font-size: 25rpx; font-weight: 670; }
.view-tabs__item.active { background: #fbfaf7; color: #252d33; box-shadow: 0 3rpx 10rpx rgba(38, 49, 58, .08); }
.release-status { margin-top: 22rpx; padding: 24rpx; }
.release-status__top { display: flex; align-items: flex-start; justify-content: space-between; gap: 20rpx; }
.release-status__quarter { display: block; color: #252d33; font-size: 29rpx; font-weight: 760; }
.release-status__desc { display: block; margin-top: 6rpx; color: #7e8488; font-size: 21rpx; }
.release-flow { display: grid; grid-template-columns: auto 1fr auto 1fr auto; align-items: start; margin-top: 28rpx; }
.release-step { display: flex; width: 92rpx; flex-direction: column; align-items: center; gap: 7rpx; color: #8a8f92; font-size: 19rpx; white-space: nowrap; }
.release-step__dot { display: flex; width: 42rpx; height: 42rpx; align-items: center; justify-content: center; border: 1rpx solid #cfcec8; border-radius: 50%; background: #eeede8; }
.release-step.done { color: #3e6552; }
.release-step.done .release-step__dot { border-color: #3d7058; background: #3d7058; }
.release-line { height: 2rpx; margin-top: 21rpx; background: #d7d6d0; }
.release-line.done { background: #6c8e7d; }
.honor-board { margin-top: 24rpx; overflow: hidden; border: 1rpx solid #3d454c; border-radius: 24rpx; background: #fbf8f2; }
.honor-board__masthead { display: flex; min-height: 116rpx; align-items: center; gap: 16rpx; padding: 20rpx 24rpx; background: #303941; color: #f8f4ed; }
.honor-board__emblem { display: flex; width: 70rpx; height: 70rpx; flex: 0 0 70rpx; align-items: center; justify-content: center; border: 1rpx solid #6e757a; border-radius: 19rpx; }
.honor-board__title { display: block; font-size: 30rpx; font-weight: 780; letter-spacing: 2rpx; }
.honor-board__subtitle { display: block; margin-top: 5rpx; color: #bdc1c3; font-size: 20rpx; }
.preview-stamp { margin-left: auto; padding: 7rpx 12rpx; border: 1rpx solid #8c9296; border-radius: 8rpx; color: #d5d7d8; font-size: 18rpx; letter-spacing: 2rpx; }
.honor-list { padding: 0 24rpx; }
.honor-person { display: flex; min-height: 126rpx; align-items: center; gap: 16rpx; border-bottom: 1rpx solid #dedbd4; }
.honor-person:last-child { border-bottom: 0; }
.honor-person__rank { display: flex; width: 58rpx; height: 58rpx; flex: 0 0 58rpx; align-items: center; justify-content: center; border-radius: 16rpx 16rpx 16rpx 5rpx; background: #dedbd3; color: #5f6569; font-size: 20rpx; font-weight: 800; }
.honor-person__rank.rank-1 { background: #9d4634; color: #fff5ed; }
.honor-person__rank.rank-2 { background: #66727a; color: #f5f6f3; }
.honor-person__rank.rank-3 { background: #8b7452; color: #fff7eb; }
.honor-person__copy { min-width: 0; flex: 1; }
.honor-person__line { display: flex; align-items: center; gap: 12rpx; }
.honor-person__name { color: #252d33; font-size: 28rpx; font-weight: 760; }
.honor-person__team { padding: 4rpx 10rpx; border-radius: 999rpx; background: #e8e3da; color: #666158; font-size: 18rpx; }
.honor-person__highlight { display: block; margin-top: 7rpx; overflow: hidden; color: #777c7f; font-size: 20rpx; text-overflow: ellipsis; white-space: nowrap; }
.honor-person__points { flex: 0 0 auto; text-align: right; }
.honor-person__points text:first-child { display: block; color: #9e3523; font-size: 31rpx; font-weight: 800; }
.honor-person__points text:last-child { display: block; margin-top: 3rpx; color: #8c9093; font-size: 18rpx; }
.result-empty { margin-top: 24rpx; }
.empty-action { margin: 22rpx auto 0; }
.flag-award { display: flex; margin-top: 22rpx; overflow: hidden; }
.flag-award__flag { display: flex; width: 176rpx; flex: 0 0 176rpx; flex-direction: column; align-items: center; justify-content: center; gap: 10rpx; background: #a73827; color: #fff4ec; font-size: 23rpx; font-weight: 750; letter-spacing: 2rpx; }
.flag-award__content { min-width: 0; flex: 1; padding: 24rpx 22rpx; }
.flag-award__eyebrow { display: block; color: #7b8083; font-size: 20rpx; }
.flag-award__name { display: block; margin-top: 5rpx; color: #252d33; font-size: 32rpx; font-weight: 800; }
.flag-award__metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12rpx; margin-top: 20rpx; }
.flag-award__metrics view { min-width: 0; }
.flag-award__metrics text:first-child { display: block; color: #343c42; font-size: 24rpx; font-weight: 750; }
.flag-award__metrics text:last-child { display: block; margin-top: 4rpx; color: #858a8e; font-size: 18rpx; white-space: nowrap; }
.team-missing { display: flex; align-items: center; gap: 14rpx; margin-top: 22rpx; padding: 22rpx; }
.team-missing text { display: block; }
.team-missing text:first-child { color: #363d43; font-size: 24rpx; font-weight: 680; }
.team-missing text:last-child { margin-top: 4rpx; color: #858a8e; font-size: 20rpx; }
.publish-note { display: flex; align-items: flex-start; gap: 11rpx; margin-top: 22rpx; padding: 0 6rpx; color: #747b7f; font-size: 21rpx; line-height: 1.55; }
.publish-button { margin-top: 20rpx; }
.published-receipt { display: flex; align-items: center; gap: 14rpx; margin-top: 20rpx; padding: 20rpx; }
.published-receipt__icon { display: flex; width: 62rpx; height: 62rpx; flex: 0 0 62rpx; align-items: center; justify-content: center; border-radius: 50%; background: #e3efe8; }
.published-receipt > view:nth-child(2) { min-width: 0; flex: 1; }
.published-receipt text { display: block; }
.published-receipt text:first-child { color: #2e3c35; font-size: 24rpx; font-weight: 720; }
.published-receipt text:last-child { margin-top: 4rpx; color: #7a8380; font-size: 19rpx; }
.archive-intro { display: flex; align-items: flex-end; justify-content: space-between; gap: 20rpx; margin-top: 25rpx; }
.archive-intro__title { display: block; color: #252d33; font-size: 30rpx; font-weight: 760; }
.archive-intro__subtitle { display: block; margin-top: 6rpx; color: #7e8488; font-size: 21rpx; }
.archive-count { padding: 7rpx 14rpx; border-radius: 999rpx; background: #e8e7e2; color: #687075; font-size: 20rpx; }
.archive-tools { display: grid; grid-template-columns: 1fr auto; gap: 12rpx; margin-top: 20rpx; padding: 12rpx; }
.search-control { display: flex; min-height: 72rpx; align-items: center; gap: 10rpx; padding: 0 14rpx; border: 1rpx solid #d8d7d1; border-radius: 14rpx; background: #fdfcf9; }
.search-control input { min-width: 0; flex: 1; color: #343b41; font-size: 23rpx; }
.clear-search { display: flex; width: 46rpx; height: 46rpx; align-items: center; justify-content: center; border-radius: 50%; }
.year-picker { display: flex; min-height: 72rpx; align-items: center; gap: 7rpx; padding: 0 14rpx; border: 1rpx solid #d8d7d1; border-radius: 14rpx; background: #f7f6f2; color: #555d62; font-size: 21rpx; }
.archive-list { display: grid; gap: 16rpx; margin-top: 20rpx; }
.archive-card { overflow: hidden; }
.archive-card__summary { display: flex; width: 100%; min-height: 106rpx; align-items: center; gap: 14rpx; padding: 16rpx 18rpx; text-align: left; }
.archive-card__summary:active { background: #efeee9; }
.archive-card__year { display: flex; width: 70rpx; height: 70rpx; flex: 0 0 70rpx; flex-direction: column; align-items: center; justify-content: center; border-radius: 17rpx; background: #353e45; color: #f7f5ef; }
.archive-card__year text:first-child { font-size: 19rpx; font-weight: 700; }
.archive-card__year text:last-child { margin-top: 3rpx; color: #c8cbcd; font-size: 17rpx; }
.archive-card__copy { min-width: 0; flex: 1; }
.archive-card__copy text:first-child { display: block; color: #2c343a; font-size: 25rpx; font-weight: 700; }
.archive-card__copy text:last-child { display: block; margin-top: 6rpx; overflow: hidden; color: #7f8589; font-size: 20rpx; text-overflow: ellipsis; white-space: nowrap; }
.archive-card__detail { padding: 4rpx 20rpx 16rpx; border-top: 1rpx solid #e0dfda; background: #f5f4ef; }
.archive-detail__line { display: flex; justify-content: space-between; gap: 20rpx; padding: 14rpx 0; border-bottom: 1rpx solid #e2e1dc; font-size: 21rpx; }
.archive-detail__line:last-child { border-bottom: 0; }
.archive-detail__line text:first-child { color: #858a8e; }
.archive-detail__line text:last-child { color: #3b4248; font-weight: 650; text-align: right; }
</style>
