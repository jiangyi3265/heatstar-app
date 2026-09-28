<template>
  <view class="page-shell admin-shell">
    <AppHeader title="提案导出" :subtitle="`${accessScope || '按权限查看'} · 共 ${count} 条`" :back="true" />

    <view class="page-body page-body--actions">
      <view class="intro surface">
        <AppIcon name="download" :size="38" tone="soft" />
        <view class="intro__content">
          <text class="intro__title">直接选择要导出的提案</text>
          <text class="intro__text">文件格式已和提案类型绑定，系统会自动使用对应模板。</text>
          <view class="template-rules">
            <view class="template-rule">
              <text class="template-rule__format template-rule__format--word">Excel</text>
              <text>各类方案台账与评审记录</text>
            </view>
            <view class="template-rule">
              <text class="template-rule__format template-rule__format--word">Word</text>
              <text>精益提案、工具开发、OPL 单点课程</text>
            </view>
            <view class="template-rule">
              <text class="template-rule__format template-rule__format--ppt">PPT</text>
              <text>六源改善</text>
            </view>
          </view>
        </view>
      </view>

      <view class="filters surface">
        <view class="filter-item">
          <text class="filter-label">部门</text>
          <picker :range="departmentLabels" :value="departmentIndex" @change="changeDepartment(Number($event.detail.value))"><view class="picker-control">{{ departmentLabels[departmentIndex] }}</view></picker>
        </view>
        <view class="filter-item">
          <text class="filter-label">统计月份</text>
          <picker :range="monthLabels" :value="monthIndex" @change="monthIndex = Number($event.detail.value)">
            <view class="picker-control"><text>{{ monthLabels[monthIndex] }}</text><AppIcon name="chevron-down" :size="28" tone="muted" /></view>
          </picker>
        </view>
        <view class="filter-item">
          <text class="filter-label">工段</text>
          <picker :range="sectionOptions" :value="sectionIndex" @change="changeSection(Number($event.detail.value))">
            <view class="picker-control"><text>{{ sectionOptions[sectionIndex] }}</text><AppIcon name="chevron-down" :size="28" tone="muted" /></view>
          </picker>
        </view>
        <view class="filter-item">
          <text class="filter-label">班组</text>
          <picker :range="teamOptions" :value="teamIndex" @change="teamIndex = Number($event.detail.value)">
            <view class="picker-control"><text>{{ teamOptions[teamIndex] }}</text><AppIcon name="chevron-down" :size="28" tone="muted" /></view>
          </picker>
        </view>
        <view class="filter-item">
          <text class="filter-label">提案类型</text>
          <picker :range="typeLabels" :value="typeIndex" @change="typeIndex = Number($event.detail.value)">
            <view class="picker-control"><text>{{ typeLabels[typeIndex] }}</text><AppIcon name="chevron-down" :size="28" tone="muted" /></view>
          </picker>
        </view>
        <view class="filter-item">
          <text class="filter-label">审核状态</text>
          <picker :range="statusLabels" :value="statusIndex" @change="statusIndex = Number($event.detail.value)">
            <view class="picker-control"><text>{{ statusLabels[statusIndex] }}</text><AppIcon name="chevron-down" :size="28" tone="muted" /></view>
          </picker>
        </view>
        <view class="filter-item filter-item--reset">
          <button class="btn btn--secondary btn--small" @tap="resetFilters">清除筛选</button>
        </view>
      </view>

      <view class="result-strip">
        <view class="result-strip__count">
          <text class="mono-number">{{ exportCount }}</text>
          <text>条已选择</text>
        </view>
        <text class="result-strip__scope">可选 {{ availableItems.length }} 条</text>
        <text v-if="exportCount" class="result-strip__format">{{ selectedFormatSummary }}</text>
        <text v-if="loading" class="result-strip__state">正在统计…</text>
      </view>

      <view v-if="availableItems.length" class="preview-list">
        <view class="preview-head">
          <button class="check-button" :aria-label="allSelected ? '取消全选' : '全选'" @tap="toggleAll">
            <view class="check-box" :class="{ checked: allSelected }"><AppIcon v-if="allSelected" name="check" :size="22" tone="inverse" /></view>
            <text>{{ allSelected ? '取消全选' : '全选' }}</text>
          </button>
          <text>编号</text><text>提案名称</text><text>班组</text><text>提交人</text><text>状态</text><text>文件</text>
        </view>
        <checkbox-group @change="changeSelection">
          <label v-for="item in availableItems" :key="item.id" class="preview-row">
            <checkbox class="row-checkbox" :value="String(item.id)" :checked="selectedIds.includes(String(item.id))" color="#b93c28" />
            <text class="mono-number preview-id">{{ item.sourceNo || item.id }}</text>
            <text class="preview-title">{{ item.title }}</text>
            <text class="preview-team">{{ item.department }} · {{ item.team }}</text>
            <text class="preview-author">{{ item.firstAuthor }}</text>
            <text class="preview-status">{{ statusText(item.status) }}</text>
            <view class="preview-format" :class="`preview-format--${proposalExportFormat(item.type)}`">
              <text>{{ proposalExportFormatLabel(item.type) }}</text>
            </view>
          </label>
        </checkbox-group>
      </view>

      <view v-else class="empty-state surface">
        <AppIcon name="archive" :size="64" tone="muted" />
        <view class="empty-state__title">{{ loading ? '正在统计…' : '该范围内没有提案' }}</view>
        <view class="empty-state__text">只能查看并导出本人或管辖范围内的提案。</view>
      </view>
    </view>

    <view class="sticky-actions">
      <button class="btn btn--secondary" :disabled="!exportCount || exporting" @tap="exportLedger"><AppIcon name="file-spreadsheet" :size="32" />导出台账</button>
      <button class="btn btn--primary" :disabled="!exportCount || exporting" @tap="exportFile">
        <AppIcon name="download" :size="32" tone="inverse" />{{ exporting ? '正在生成…' : exportButtonText }}
      </button>
    </view>
  </view>
</template>

<script>
import AppHeader from '../../components/AppHeader.vue'
import AppIcon from '../../components/AppIcon.vue'
import { readStorage, STORAGE_KEYS } from '../../utils/storage.js'
import { request, downloadFile, ensureSynchronized } from '../../utils/api.js'
import { recentMonths } from '../../utils/stats.js'
import { proposalExportFormat, proposalExportFormatLabel } from '../../utils/proposal-types.js'
import { getDepartments, departmentId } from '../../utils/organization.js'

const STATUS = [
  { value: '', label: '全部状态' },
  { value: 'pending_team', label: '班组长审核中' },
  { value: 'pending_review', label: '部门/制造厂小组评审中' },
  { value: 'pending_company', label: '公司审核中' },
  { value: 'approved', label: '已采纳' },
  { value: 'rejected', label: '已驳回' }
]
const TYPES = [
  { value: '', label: '全部类型' },
  { value: 'lean', label: '精益提案' },
  { value: 'six', label: '六源改善' },
  { value: 'tool', label: '工具开发' },
  { value: 'opl', label: 'OPL 单点课程' }
]

export default {
  components: { AppHeader, AppIcon },
  data() {
    return {
      teams: [],
      departments: [],
      departmentIndex: 0,
      months: recentMonths(12),
      monthIndex: 0,
      sectionIndex: 0,
      teamIndex: 0,
      typeIndex: 0,
      statusIndex: 0,
      count: 0,
      scope: '',
      accessScope: '',
      items: [],
      selectedIds: [],
      resetSelection: true,
      loading: false,
      refreshSequence: 0,
      exporting: false,
      statusLabels: STATUS.map(item => item.label),
      typeLabels: TYPES.map(item => item.label)
    }
  },
  computed: {
    departmentLabels() { return ['全部部门', ...this.departments.map(d => d.name)] },
    departmentTeams() { return this.departmentIndex > 0 ? this.teams.filter(t => departmentId(t) === this.departments[this.departmentIndex - 1]?.id) : this.teams },
    exportCount() {
      return this.selectedItems.length
    },
    availableItems() {
      return this.items
    },
    availableIds() {
      return this.availableItems.map(item => String(item.id))
    },
    allSelected() {
      return Boolean(this.availableIds.length) && this.availableIds.every(id => this.selectedIds.includes(id))
    },
    selectedItems() {
      const selected = new Set(this.selectedIds)
      return this.items.filter(item => selected.has(String(item.id)))
    },
    wordSelectedIds() {
      return this.selectedItems.filter(item => proposalExportFormat(item.type) === 'docx').map(item => String(item.id))
    },
    pptSelectedIds() {
      return this.selectedItems.filter(item => proposalExportFormat(item.type) === 'pptx').map(item => String(item.id))
    },
    selectedFormatSummary() {
      const parts = []
      if (this.wordSelectedIds.length) parts.push(`Word ${this.wordSelectedIds.length} 份`)
      if (this.pptSelectedIds.length) parts.push(`PPT ${this.pptSelectedIds.length} 份`)
      return parts.join('，')
    },
    exportButtonText() {
      return this.exportCount ? `导出 ${this.exportCount} 个项目` : '请选择提案'
    },
    monthLabels() {
      return ['全部月份', ...this.months.map(item => item.label)]
    },
    sectionOptions() {
      return ['全部工段', ...Array.from(new Set(this.departmentTeams.map(item => item.section).filter(Boolean)))]
    },
    teamOptions() {
      const section = this.sectionIndex > 0 ? this.sectionOptions[this.sectionIndex] : ''
      const list = section ? this.departmentTeams.filter(item => item.section === section) : this.departmentTeams
      return ['全部班组', ...new Set(list.map(item => item.name))]
    },
    query() {
      const parts = []
      if (this.departmentIndex > 0) parts.push(`departmentId=${encodeURIComponent(this.departments[this.departmentIndex - 1].id)}`)
      if (this.monthIndex > 0) parts.push(`month=${encodeURIComponent(this.months[this.monthIndex - 1].value)}`)
      if (this.sectionIndex > 0) parts.push(`section=${encodeURIComponent(this.sectionOptions[this.sectionIndex])}`)
      if (this.teamIndex > 0) parts.push(`team=${encodeURIComponent(this.teamOptions[this.teamIndex])}`)
      if (this.typeIndex > 0) parts.push(`type=${encodeURIComponent(TYPES[this.typeIndex].value)}`)
      if (this.statusIndex > 0) parts.push(`status=${encodeURIComponent(STATUS[this.statusIndex].value)}`)
      return parts.join('&')
    }
  },
  watch: {
    query() {
      this.resetSelection = true
      this.refresh()
    }
  },
  async onShow() {
    await ensureSynchronized()
    this.teams = readStorage(STORAGE_KEYS.teams, [])
    this.departments = getDepartments()
    this.refresh()
  },
  methods: {
    changeDepartment(index) { this.departmentIndex = index; this.sectionIndex = 0; this.teamIndex = 0 },
    proposalExportFormat,
    proposalExportFormatLabel,
    statusText(value) {
      const found = STATUS.find(item => item.value === value)
      return found ? found.label : value || '—'
    },
    changeSection(index) {
      this.sectionIndex = index
      this.teamIndex = 0
    },
    resetFilters() {
      this.departmentIndex = 0
      this.monthIndex = 0
      this.sectionIndex = 0
      this.teamIndex = 0
      this.typeIndex = 0
      this.statusIndex = 0
    },
    changeSelection(event) {
      this.selectedIds = (event.detail.value || []).map(String)
    },
    toggleAll() {
      this.selectedIds = this.allSelected ? [] : [...this.availableIds]
    },
    async refresh() {
      const sequence = ++this.refreshSequence
      this.loading = true
      if (this.resetSelection) this.selectedIds = []
      try {
        const suffix = this.query ? `?${this.query}` : ''
        const result = await request(`/export/proposals/preview${suffix}`)
        if (sequence !== this.refreshSequence) return
        this.count = result.count || 0
        this.scope = result.scope || ''
        this.accessScope = result.accessScope || ''
        this.items = result.items || []
        const currentIds = this.items.map(item => String(item.id))
        this.selectedIds = this.resetSelection
          ? []
          : this.selectedIds.filter(id => currentIds.includes(id))
        this.resetSelection = false
      } catch (error) {
        if (sequence !== this.refreshSequence) return
        this.count = 0
        this.items = []
        this.selectedIds = []
        uni.showToast({ title: error.message || '统计失败', icon: 'none' })
      } finally {
        if (sequence === this.refreshSequence) this.loading = false
      }
    },
    async exportLedger() {
      if (!this.exportCount || this.exporting) return
      this.exporting = true
      uni.showLoading({title:'正在生成台账'})
      try {
        const suffix = this.query ? `?${this.query}` : ''
        await downloadFile(`/export/proposals.xlsx${suffix}`, {data:{ids:this.selectedItems.map(x => String(x.id))}, fileType:'xlsx', fileName:'热创星提案台账.xlsx'})
        uni.showToast({title:'台账已生成',icon:'success'})
      } catch (error) { uni.showToast({title:error.message || '导出失败',icon:'none'}) }
      finally { uni.hideLoading(); this.exporting = false }
    },
    async exportFile() {
      if (!this.exportCount || this.exporting) return
      this.exporting = true
      uni.showLoading({ title: '正在生成' })
      try {
        const suffix = this.query ? `?${this.query}` : ''
        const plans = []
        if (this.wordSelectedIds.length) plans.push({
          extension: 'docx',
          label: 'Word',
          ids: this.wordSelectedIds,
          fileName: `热创星提案申报表-${this.scope || '全部'}.docx`
        })
        if (this.pptSelectedIds.length) plans.push({
          extension: 'pptx',
          label: 'PPT',
          ids: this.pptSelectedIds,
          fileName: `热创星六源案例-${this.scope || '全部'}.pptx`
        })
        for (const plan of plans) {
          if (plans.length > 1) uni.showLoading({ title: `正在生成${plan.label}` })
          await downloadFile(`/export/proposals.${plan.extension}${suffix}`, {
            data: { ids: plan.ids },
            fileType: plan.extension,
            fileName: plan.fileName
          })
        }
        uni.hideLoading()
        uni.showToast({ title: plans.length > 1 ? '已生成两个文件' : '已开始下载', icon: 'success' })
      } catch (error) {
        uni.hideLoading()
        uni.showToast({ title: error.message || '导出失败', icon: 'none' })
      } finally {
        this.exporting = false
      }
    }
  }
}
</script>

<style scoped>
.page-body--actions { padding-bottom: calc(170rpx + env(safe-area-inset-bottom)); }
.intro { display: flex; align-items: flex-start; gap: 16rpx; padding: 24rpx; }
.intro__content { min-width: 0; flex: 1; }
.intro__title { display: block; color: #252c32; font-size: 27rpx; font-weight: 750; }
.intro__text { display: block; margin-top: 5rpx; color: #6b7175; font-size: 23rpx; line-height: 1.7; }
.template-rules { display: grid; gap: 7rpx; margin-top: 14rpx; color: #5f666b; font-size: 22rpx; }
.template-rule { display: flex; align-items: center; gap: 10rpx; }
.template-rule__format { min-width: 76rpx; padding: 4rpx 10rpx; border-radius: 999rpx; font-size: 19rpx; font-weight: 750; text-align: center; }
.template-rule__format--word { background: #e7edf2; color: #375f76; }
.template-rule__format--ppt { background: #f8e7e2; color: #922d20; }
.filters { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20rpx; margin-top: 20rpx; padding: 24rpx; }
.filter-item { min-width: 0; }
.filter-item--reset { display: flex; align-items: flex-end; }
.filter-label { display: block; margin-bottom: 10rpx; color: #363c42; font-size: 23rpx; font-weight: 600; }
.result-strip { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8rpx 16rpx; margin-top: 24rpx; padding: 0 6rpx; }
.result-strip__count { display: flex; align-items: baseline; gap: 8rpx; }
.result-strip__count text:first-child { color: #b93c28; font-size: 40rpx; font-weight: 800; }
.result-strip__count text:last-child { color: #6b7175; font-size: 23rpx; }
.result-strip__scope { color: #6b7175; font-size: 23rpx; }
.result-strip__format { color: #4f575c; font-size: 22rpx; font-weight: 650; }
.result-strip__state { color: #94989a; font-size: 22rpx; }
.preview-list { overflow: hidden; margin-top: 18rpx; border: 1rpx solid #deddd7; border-radius: 20rpx; background: #fbfaf7; }
.preview-head, .preview-row { display: grid; grid-template-columns: minmax(104rpx,auto) minmax(0,1.3fr) minmax(0,2.4fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1.2fr) minmax(0,.8fr); gap: 12rpx; padding: 18rpx 22rpx; align-items: center; }
.preview-head { border-bottom: 1rpx solid #e2e1dc; background: #f2f1ec; color: #565c61; font-size: 21rpx; font-weight: 700; }
.check-button { display: flex; align-items: center; gap: 7rpx; padding: 0; color: #565c61; font-size: inherit; font-weight: inherit; line-height: 1; text-align: left; }
.check-box { display: flex; width: 30rpx; height: 30rpx; align-items: center; justify-content: center; border: 1rpx solid #aead9f; border-radius: 7rpx; background: #fbfaf7; }
.check-box.checked { border-color: #b93c28; background: #b93c28; }
.preview-row { border-top: 1rpx solid #eceae4; font-size: 22rpx; }
.preview-row:first-child { border-top: 0; }
.row-checkbox { transform: scale(.82); transform-origin: left center; }
.preview-title { overflow: hidden; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
.preview-format { justify-self: start; padding: 4rpx 10rpx; border-radius: 999rpx; font-size: 19rpx; font-weight: 750; }
.preview-format--docx { background: #e7edf2; color: #375f76; }
.preview-format--pptx { background: #f8e7e2; color: #922d20; }
.empty-state { margin-top: 18rpx; }
.empty-state :deep(.app-icon) { margin: 0 auto; }

@media (min-width: 860px) {
  .page-body--actions { padding-bottom: 96px; }
  .intro { padding: 16px 18px; gap: 12px; }
  .intro__title { font-size: 15px; }
  .intro__text { font-size: 13px; }
  .template-rules { gap: 4px; margin-top: 8px; font-size: 12px; }
  .template-rule__format { min-width: 42px; padding: 2px 6px; font-size: 11px; }
  .filters { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-top: 18px; padding: 18px; }
  .filter-label { font-size: 13px; margin-bottom: 6px; }
  .result-strip { margin-top: 20px; }
  .result-strip__count text:first-child { font-size: 28px; }
  .result-strip__count text:last-child, .result-strip__scope, .result-strip__format { font-size: 13px; }
  .preview-list { margin-top: 14px; border-radius: 12px; }
  .preview-head, .preview-row { padding: 10px 16px; gap: 10px; }
  .preview-head { font-size: 12px; }
  .preview-row { font-size: 13px; }
  .empty-state { margin-top: 14px; }
}

@media (max-width: 560px) {
  .preview-head { grid-template-columns: 1fr; }
  .preview-head > text { display: none; }
  .preview-row { grid-template-columns: 54rpx minmax(0, 1fr) auto; gap: 8rpx 12rpx; padding: 20rpx; }
  .row-checkbox { grid-row: 1 / span 4; align-self: center; }
  .preview-title { grid-column: 2 / span 2; font-size: 25rpx; white-space: normal; }
  .preview-id { grid-column: 2; color: #6b7175; font-size: 19rpx; }
  .preview-team { grid-column: 2; color: #6b7175; font-size: 20rpx; }
  .preview-author { grid-column: 3; grid-row: 2; color: #6b7175; font-size: 20rpx; }
  .preview-status { grid-column: 3; grid-row: 3; color: #963526; font-size: 20rpx; }
  .preview-format { grid-column: 3; grid-row: 4; padding: 3rpx 9rpx; font-size: 18rpx; }
}
</style>
