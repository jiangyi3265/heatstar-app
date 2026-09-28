<template>
  <view class="page-shell">
    <AppHeader title="分享会记录" subtitle="一场一次登记，签到人员自动计次" :back="true" action-icon="plus" action-label="新增分享会记录" @action="toggleForm" />

    <view class="page-body">
      <view class="quarter-label">
        <view>
          <text class="quarter-label__title">{{ quarterLabel }}</text>
          <text class="quarter-label__subtitle">主持人仅作活动信息，只有签到名单中的人员计入个人次数</text>
        </view>
        <StatusTag label="持续登记" status="pending_record" />
      </view>

      <view class="summary-strip surface">
        <view class="summary-item"><text class="summary-item__value mono-number">{{ records.length }}</text><text class="summary-item__label">分享场次</text></view>
        <view class="summary-item"><text class="summary-item__value mono-number">{{ registeredAttendances }}</text><text class="summary-item__label">已登记人次</text></view>
        <view class="summary-item"><text class="summary-item__value mono-number">{{ averageRate }}%</text><text class="summary-item__label">平均签到率</text></view>
      </view>

      <view v-if="showForm" class="entry-form surface">
        <view class="entry-form__head">
          <view>
            <text class="entry-form__title">{{ editingId ? '补录 / 修改分享会' : '新增分享会' }}</text>
            <text class="entry-form__subtitle">整场只保存一条记录，实到人数由签到名单自动统计</text>
          </view>
          <button class="close-button" aria-label="关闭表单" @tap="closeForm"><AppIcon name="x" :size="34" tone="muted" /></button>
        </view>

        <view class="form-body">
          <view class="rule-note">
            <view class="rule-note__icon"><AppIcon name="list-check" :size="34" /></view>
            <view><text>个人计次口径</text><text>每场每位签到人员 +1 次；主持人如果未签到，不自动计次。</text></view>
          </view>

          <view class="two-column">
            <view class="field-group">
              <text class="field-label"><text class="field-required">*</text> 日期</text>
              <picker mode="date" :value="form.date" @change="form.date = $event.detail.value">
                <view class="picker-control compact-control"><text>{{ form.date }}</text><AppIcon name="calendar" :size="30" tone="muted" /></view>
              </picker>
            </view>
            <view class="field-group">
              <text class="field-label"><text class="field-required">*</text> 班组</text>
              <picker :range="teamOptions" :value="teamIndex" @change="changeTeam">
                <view class="picker-control compact-control"><text :class="{ placeholder: !form.team }">{{ form.team || '请选择' }}</text><AppIcon name="chevron-down" :size="28" tone="muted" /></view>
              </picker>
            </view>
          </view>

          <view class="field-group">
            <text class="field-label"><text class="field-required">*</text> 主持人</text>
            <input v-model="form.host" class="input-control" maxlength="20" placeholder="填写主持人姓名（仅作活动信息）" />
          </view>

          <view class="attendance-grid">
            <view class="field-group"><text class="field-label"><text class="field-required">*</text> 应到</text><input v-model="form.shouldAttend" class="input-control" type="number" placeholder="0" /></view>
            <view class="field-group"><text class="field-label">实到</text><view class="calculated-control"><text class="mono-number">{{ form.attendees.length }}</text></view></view>
            <view class="field-group"><text class="field-label">签到率</text><view class="calculated-control calculated-control--accent"><text class="mono-number">{{ calculatedRate }}%</text></view></view>
          </view>

          <view class="field-group attendance-picker">
            <view class="field-heading-row">
              <view><text class="field-label"><text class="field-required">*</text> 签到人员</text><text class="field-help">选中或批量粘贴，名单中的每个人记 1 次</text></view>
              <view class="field-actions"><button class="text-action" @tap="selectTeamMembers">全选本班组</button><button class="text-action text-action--muted" @tap="clearAttendees">清空</button></view>
            </view>

            <scroll-view v-if="currentTeamPeople.length" scroll-x class="roster-scroll">
              <view class="roster-row">
                <button v-for="person in currentTeamPeople" :key="person.workNo || person.name" :class="['roster-chip', { 'roster-chip--selected': isSelected(person) }]" @tap="toggleAttendee(person)">
                  <AppIcon :name="isSelected(person) ? 'circle-check' : 'user-circle'" :size="26" /><text>{{ person.name }}</text>
                </button>
              </view>
            </scroll-view>
            <view v-else class="roster-empty">选择班组后可快速勾选在岗人员，也可直接粘贴签到名单。</view>

            <view class="paste-box">
              <textarea v-model="form.attendeeInput" class="attendee-textarea" maxlength="1000" placeholder="从 Excel / 签到表粘贴姓名或工号，支持换行、顿号、逗号分隔" />
              <button class="recognize-button" @tap="applyAttendeeInput"><AppIcon name="list-check" :size="28" tone="inverse" />识别并加入名单</button>
            </view>

            <view :class="['selected-attendees', { 'selected-attendees--empty': !form.attendees.length }]">
              <view class="selected-attendees__head">
                <text>已登记 {{ form.attendees.length }} 人</text>
                <text v-if="unmatchedAttendeeCount">其中 {{ unmatchedAttendeeCount }} 人未匹配工号，仍按姓名计次</text>
                <text v-else-if="form.attendees.length">工号已关联，可准确计入个人数据</text>
                <text v-else>尚未登记签到人员</text>
              </view>
              <view v-if="form.attendees.length" class="selected-chip-list">
                <button v-for="person in form.attendees" :key="attendeeKey(person)" class="selected-chip" @tap="removeAttendee(person)"><text>{{ person.name || person.workNo }}</text><AppIcon name="x" :size="22" tone="muted" /></button>
              </view>
            </view>
          </view>

          <view class="field-group"><text class="field-label">分享案例数</text><input v-model="form.cases" class="input-control" type="number" placeholder="例如：2" /></view>

          <view class="field-group">
            <text class="field-label"><text class="field-required">*</text> 签到表附件</text>
            <button v-if="!form.signInName" class="upload-control" @tap="chooseAttachment('signIn')">
              <view class="upload-control__icon"><AppIcon name="file-spreadsheet" :size="36" /></view>
              <view class="upload-control__copy"><text>上传原始签到表</text><text>支持 Excel、PDF、Word 或图片，用于核对参与记录</text></view><AppIcon name="chevron-right" :size="28" tone="muted" />
            </button>
            <view v-else class="attachment-selected">
              <view class="file-mark"><AppIcon name="clipboard-check" :size="34" /></view>
              <view class="attachment-selected__copy"><text>{{ form.signInName }}</text><text>{{ form.signInSize || '已上传，保存后留档' }}</text></view>
              <button class="remove-file" aria-label="移除签到表" @tap="clearAttachment('signIn')"><AppIcon name="trash" :size="32" tone="muted" /></button>
            </view>
          </view>

          <view class="field-group">
            <text class="field-label">分享案例附件</text>
            <button v-if="!form.caseName" class="upload-control" @tap="chooseAttachment('case')">
              <view class="upload-control__icon"><AppIcon name="upload" :size="36" /></view>
              <view class="upload-control__copy"><text>上传案例材料（选填）</text><text>支持 PDF、PPT、Word、Excel 或图片</text></view><AppIcon name="chevron-right" :size="28" tone="muted" />
            </button>
            <view v-else class="attachment-selected">
              <view class="file-mark"><AppIcon name="clipboard-text" :size="34" /></view>
              <view class="attachment-selected__copy"><text>{{ form.caseName }}</text><text>{{ form.caseSize || '已上传，保存后留档' }}</text></view>
              <button class="remove-file" aria-label="移除案例附件" @tap="clearAttachment('case')"><AppIcon name="trash" :size="32" tone="muted" /></button>
            </view>
          </view>

          <view v-if="errorText" class="form-error"><AppIcon name="alert-triangle" :size="30" /><text>{{ errorText }}</text></view>
          <view class="button-row"><button class="btn btn--secondary" @tap="closeForm">取消</button><button class="btn btn--primary" @tap="saveRecord"><AppIcon name="device-floppy" :size="32" tone="inverse" />{{ editingId ? '保存修改' : '保存本场记录' }}</button></view>
        </view>
      </view>

      <view class="section-block">
        <view class="section-heading"><view><text class="section-title">记录明细</text><text class="section-subtitle">一场一条；历史记录可补录签到名单</text></view></view>
        <scroll-view scroll-x class="filter-scroll"><view class="filter-row"><button v-for="option in filterOptions" :key="option" :class="['chip', { 'chip--active': activeFilter === option }]" @tap="activeFilter = option">{{ option }}</button></view></scroll-view>
      </view>

      <view v-if="filteredRecords.length" class="record-list">
        <view v-for="record in filteredRecords" :key="record.id" class="record-item surface">
          <view class="record-item__head">
            <view class="date-block"><text class="date-block__day mono-number">{{ dayOf(record.date) }}</text><text class="date-block__month">{{ monthOf(record.date) }}</text></view>
            <view class="record-item__title"><text>{{ record.team }}改善分享会</text><text>{{ record.date }} · 主持人 {{ record.host }}</text></view>
            <view class="record-actions">
              <button class="more-action" aria-label="修改或补录" @tap="editRecord(record)"><AppIcon name="edit" :size="30" tone="muted" /></button>
              <button v-if="record.local" class="more-action" aria-label="删除本条记录" @tap="removeRecord(record)"><AppIcon name="trash" :size="30" tone="muted" /></button>
            </view>
          </view>

          <view class="attendance-line">
            <view class="attendance-line__copy"><text>签到 {{ attendanceCount(record) }}/{{ record.shouldAttend }} 人</text><text class="mono-number">{{ recordRate(record) }}%</text></view>
            <view class="rate-track"><view class="rate-fill" :class="rateTone(recordRate(record))" :style="{ width: `${Math.min(recordRate(record), 100)}%` }" /></view>
          </view>

          <view v-if="hasAttendeeList(record)" class="attendee-detail">
            <view class="attendee-detail__head"><text>参与人员 · 每人已计 1 次</text><text>{{ attendeeList(record).length }} 人</text></view>
            <text class="attendee-detail__names">{{ attendeeSummary(record) }}</text>
          </view>
          <view v-else class="legacy-warning">
            <AppIcon name="alert-triangle" :size="28" />
            <view><text>签到名单待补录</text><text>这条历史记录仅有人数，暂不计入个人分享次数。</text></view>
            <button @tap="editRecord(record)">去补录</button>
          </view>

          <view class="record-item__foot">
            <view class="case-count"><AppIcon name="bulb" :size="30" tone="soft" /><text>{{ record.cases || 0 }} 个案例</text></view>
            <view class="attachment-links">
              <button v-if="signInName(record)" class="attachment-link" @tap="openAttachment(record, 'signIn')"><AppIcon name="clipboard-check" :size="28" tone="accent" /><text>签到表</text></button>
              <text v-else class="attachment-missing">签到表待补传</text>
              <button v-if="caseName(record)" class="attachment-link" @tap="openAttachment(record, 'case')"><AppIcon name="clipboard-text" :size="28" tone="accent" /><text>案例附件</text></button>
            </view>
          </view>
        </view>
      </view>

      <view v-else class="empty-state surface"><AppIcon name="share-2" :size="62" tone="muted" /><text class="empty-state__title">当前筛选下暂无记录</text><text class="empty-state__text">点击右上角加号，一次登记整场分享会。</text></view>
    </view>
  </view>
</template>

<script>
import AppHeader from '../../components/AppHeader.vue'
import AppIcon from '../../components/AppIcon.vue'
import StatusTag from '../../components/StatusTag.vue'
import { readStorage, writeStorage, STORAGE_KEYS } from '../../utils/storage.js'
import { downloadFile, ensureSynchronized, uploadAsset } from '../../utils/api.js'
import { quarterOf } from '../../utils/stats.js'
import { normalizeAttendees, parseAttendeeText } from '../../utils/sharing.js'

function todayText() {
  const date = new Date()
  const pad = value => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function createEmptyShareForm() {
  return { date: todayText(), team: '', host: '', shouldAttend: '', attendees: [], attendeeInput: '', cases: '', signInName: '', signInPath: '', signInSize: '', caseName: '', casePath: '', caseSize: '' }
}

function personKey(person) {
  const workNo = String(person && person.workNo || '').trim()
  return workNo ? `work:${workNo}` : `name:${String(person && person.name || '').trim()}`
}

function mergePeople(left, right) {
  const unique = new Map()
  ;[...(left || []), ...(right || [])].forEach(person => {
    if (!person || (!person.name && !person.workNo)) return
    const normalized = { name: String(person.name || '').trim(), workNo: String(person.workNo || '').trim(), team: String(person.team || '').trim() }
    const key = personKey(normalized)
    if (!unique.has(key)) unique.set(key, normalized)
  })
  return Array.from(unique.values())
}

export default {
  components: { AppHeader, AppIcon, StatusTag },
  data() {
    return { showForm: false, editingId: '', errorText: '', activeFilter: '全部', records: [], teamOptions: [], allPeople: [], form: createEmptyShareForm() }
  },
  computed: {
    quarterLabel() { return quarterOf().label },
    teamIndex() { const index = this.teamOptions.indexOf(this.form.team); return index < 0 ? 0 : index },
    currentTeamPeople() { return this.allPeople.filter(item => item.status !== '离岗' && item.team === this.form.team) },
    filterOptions() { return ['全部', ...Array.from(new Set(this.records.map(item => item.team))).slice(0, 5)] },
    filteredRecords() { const list = this.activeFilter === '全部' ? this.records : this.records.filter(item => item.team === this.activeFilter); return [...list].sort((a, b) => String(b.date).localeCompare(String(a.date))) },
    calculatedRate() { const shouldAttend = Number(this.form.shouldAttend); return shouldAttend ? Math.min(100, Math.round(this.form.attendees.length / shouldAttend * 100)) : 0 },
    registeredAttendances() { return this.records.reduce((total, item) => total + normalizeAttendees(item).length, 0) },
    averageRate() { return this.records.length ? Math.round(this.records.reduce((total, item) => total + this.recordRate(item), 0) / this.records.length) : 0 },
    unmatchedAttendeeCount() {
      const rosterKeys = new Set(this.allPeople.flatMap(item => [item.workNo ? `work:${String(item.workNo)}` : '', item.name ? `name:${String(item.name)}` : '']).filter(Boolean))
      return this.form.attendees.filter(item => !rosterKeys.has(personKey(item)) && !rosterKeys.has(`name:${item.name}`)).length
    }
  },
  async onShow() {
    await ensureSynchronized()
    this.teamOptions = (readStorage(STORAGE_KEYS.teams, []) || []).map(item => item.name)
    this.allPeople = readStorage(STORAGE_KEYS.people, []) || []
    this.loadRecords()
  },
  methods: {
    attendeeKey(person) { return personKey(person) },
    emptyForm() { return createEmptyShareForm() },
    loadRecords() { const stored = readStorage(STORAGE_KEYS.shares, null); this.records = Array.isArray(stored) ? stored.map(item => ({ ...item })) : [] },
    toggleForm() {
      if (this.showForm) return this.closeForm()
      this.editingId = ''
      this.form = this.emptyForm()
      this.showForm = true
      this.errorText = ''
    },
    closeForm() { this.showForm = false; this.editingId = ''; this.errorText = ''; this.form = this.emptyForm() },
    changeTeam(event) { this.form.team = this.teamOptions[Number(event.detail.value)] || '' },
    isSelected(person) { const key = personKey(person); return this.form.attendees.some(item => personKey(item) === key || (item.name && item.name === person.name)) },
    toggleAttendee(person) { this.isSelected(person) ? this.removeAttendee(person) : (this.form.attendees = mergePeople(this.form.attendees, [person])); this.errorText = '' },
    removeAttendee(person) { const key = personKey(person); this.form.attendees = this.form.attendees.filter(item => personKey(item) !== key) },
    selectTeamMembers() {
      if (!this.form.team) { this.errorText = '请先选择本场分享会所属班组。'; return }
      if (!this.currentTeamPeople.length) { this.errorText = '该班组暂无在岗人员，请粘贴签到名单。'; return }
      this.form.attendees = mergePeople(this.form.attendees, this.currentTeamPeople)
      this.errorText = ''
    },
    clearAttendees() { this.form.attendees = []; this.form.attendeeInput = '' },
    applyAttendeeInput() {
      const parsed = parseAttendeeText(this.form.attendeeInput, this.allPeople)
      if (!parsed.length) { this.errorText = '请先粘贴签到人员姓名或工号。'; return }
      this.form.attendees = mergePeople(this.form.attendees, parsed)
      this.form.attendeeInput = ''
      this.errorText = ''
      uni.showToast({ title: `已加入 ${parsed.length} 人`, icon: 'none' })
    },
    chooseAttachment(kind) {
      const choose = typeof uni.chooseMessageFile === 'function' ? uni.chooseMessageFile : uni.chooseFile
      if (typeof choose !== 'function') { uni.showToast({ title: '当前环境不支持文件选择', icon: 'none' }); return }
      choose({
        count: 1,
        type: 'file',
        extension: ['pdf', 'ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'],
        success: async result => {
          const file = result.tempFiles && result.tempFiles[0]
          if (!file) return
          const path = file.path || file.tempFilePath || ''
          uni.showLoading({ title: '上传附件' })
          try {
            const uploaded = await uploadAsset(path, { kind: kind === 'signIn' ? 'sign-in' : 'attachment', name: file.name })
            const prefix = kind === 'signIn' ? 'signIn' : 'case'
            this.form[`${prefix}Name`] = uploaded.name || file.name || (kind === 'signIn' ? '签到表' : '分享案例附件')
            this.form[`${prefix}Path`] = uploaded.url
            this.form[`${prefix}Size`] = this.formatSize(uploaded.size || file.size)
            this.errorText = ''
          } catch (error) {
            uni.showToast({ title: error.message || '附件上传失败', icon: 'none', duration: 2600 })
          } finally { uni.hideLoading() }
        }
      })
    },
    clearAttachment(kind) { const prefix = kind === 'signIn' ? 'signIn' : 'case'; this.form[`${prefix}Name`] = ''; this.form[`${prefix}Path`] = ''; this.form[`${prefix}Size`] = '' },
    formatSize(bytes) { const value = Number(bytes || 0); if (!value) return '已上传，保存后留档'; return value < 1024 * 1024 ? `${Math.ceil(value / 1024)} KB` : `${(value / 1024 / 1024).toFixed(1)} MB` },
    editRecord(record) {
      this.editingId = record.id
      this.form = {
        date: record.date || todayText(), team: record.team || '', host: record.host || '', shouldAttend: String(record.shouldAttend || ''), attendees: normalizeAttendees(record), attendeeInput: '', cases: String(record.cases || ''),
        signInName: this.signInName(record), signInPath: record.signInAttachmentPath || '', signInSize: '', caseName: this.caseName(record), casePath: record.attachmentPath || '', caseSize: ''
      }
      this.showForm = true
      this.errorText = ''
      if (typeof uni.pageScrollTo === 'function') uni.pageScrollTo({ scrollTop: 0, duration: 220 })
    },
    saveRecord() {
      if (this.form.attendeeInput.trim()) this.form.attendees = mergePeople(this.form.attendees, parseAttendeeText(this.form.attendeeInput, this.allPeople))
      const shouldAttend = Number(this.form.shouldAttend)
      const attended = this.form.attendees.length
      if (!this.form.date || !this.form.team || !this.form.host.trim()) { this.errorText = '请完整填写日期、班组和主持人。'; return }
      if (!Number.isInteger(shouldAttend) || shouldAttend <= 0) { this.errorText = '应到人数需填写大于 0 的整数。'; return }
      if (!attended) { this.errorText = '请勾选或粘贴本场分享会的实际签到人员。'; return }
      if (attended > shouldAttend) { this.errorText = '签到名单人数大于应到人数，请核对名单或应到人数。'; return }
      if (!this.form.signInName) { this.errorText = '请上传本场分享会的原始签到表。'; return }
      const existingIndex = this.records.findIndex(item => item.id === this.editingId)
      const existing = existingIndex >= 0 ? this.records[existingIndex] : {}
      const record = {
        ...existing, id: existing.id || `S-${Date.now()}`, date: this.form.date, team: this.form.team, host: this.form.host.trim(), shouldAttend,
        attendees: normalizeAttendees({ attendees: this.form.attendees }), attended, rate: this.calculatedRate, cases: Math.max(0, Number(this.form.cases || 0)),
        signInAttachment: this.form.signInName, signInAttachmentPath: this.form.signInPath, attachment: this.form.caseName, attachmentPath: this.form.casePath, local: existing.id ? existing.local : true
      }
      if (existingIndex >= 0) this.records.splice(existingIndex, 1, record); else this.records.unshift(record)
      writeStorage(STORAGE_KEYS.shares, this.records)
      const edited = Boolean(this.editingId)
      this.closeForm()
      uni.showToast({ title: edited ? '签到记录已更新' : '分享会已保存', icon: 'success' })
    },
    removeRecord(record) {
      uni.showModal({ title: '删除记录', content: `确认删除 ${record.date} 的分享会记录？`, confirmColor: '#b93c28', success: result => { if (!result.confirm) return; this.records = this.records.filter(item => item.id !== record.id); writeStorage(STORAGE_KEYS.shares, this.records); uni.showToast({ title: '已删除', icon: 'none' }) } })
    },
    attendeeList(record) { return normalizeAttendees(record) },
    hasAttendeeList(record) { return this.attendeeList(record).length > 0 },
    attendeeSummary(record) { const list = this.attendeeList(record); const names = list.slice(0, 8).map(item => item.name || item.workNo).join('、'); return list.length > 8 ? `${names} 等 ${list.length} 人` : names },
    attendanceCount(record) { const list = this.attendeeList(record); return list.length || Number(record.attended || 0) },
    recordRate(record) { const shouldAttend = Number(record.shouldAttend || 0); if (!shouldAttend) return 0; return this.hasAttendeeList(record) ? Math.min(100, Math.round(this.attendeeList(record).length / shouldAttend * 100)) : Number(record.rate || 0) },
    signInName(record) { if (typeof record.signInAttachment === 'string') return record.signInAttachment; return record.signInAttachment && record.signInAttachment.name ? record.signInAttachment.name : '' },
    caseName(record) { if (typeof record.attachment === 'string') return record.attachment; return record.attachment && record.attachment.name ? record.attachment.name : '' },
    async openAttachment(record, kind) {
      const signIn = kind === 'signIn'
      const path = signIn ? record.signInAttachmentPath : record.attachmentPath
      const name = signIn ? this.signInName(record) : this.caseName(record)
      if (path && /^https?:\/\//i.test(path)) { try { await downloadFile(path, { fileName: name }) } catch (error) { uni.showToast({ title: error.message || '附件打开失败', icon: 'none' }) }; return }
      if (path && typeof uni.openDocument === 'function') { uni.openDocument({ filePath: path, showMenu: true, fail: () => uni.showToast({ title: '文件已失效，请重新上传', icon: 'none' }) }); return }
      uni.showToast({ title: `历史附件未上传：${name || '未命名文件'}`, icon: 'none', duration: 2200 })
    },
    dayOf(date) { return String(date || '').slice(8, 10) || '--' },
    monthOf(date) { const month = String(date || '').slice(5, 7); return month ? `${Number(month)} 月` : '--' },
    rateTone(rate) { if (Number(rate) >= 90) return 'good'; if (Number(rate) >= 75) return 'medium'; return 'low' }
  }
}
</script>

<style scoped>
.quarter-label { display: flex; align-items: center; justify-content: space-between; gap: 20rpx; margin-bottom: 20rpx; }
.quarter-label__title { display: block; color: #232a30; font-size: 29rpx; font-weight: 750; }
.quarter-label__subtitle { display: block; max-width: 560rpx; margin-top: 6rpx; color: #7d8387; font-size: 21rpx; line-height: 1.45; }
.summary-strip { display: grid; grid-template-columns: repeat(3, 1fr); overflow: hidden; }
.summary-item { display: flex; min-height: 126rpx; flex-direction: column; align-items: center; justify-content: center; border-right: 1rpx solid #deddd7; }
.summary-item:last-child { border-right: 0; }
.summary-item__value { color: #2b3339; font-size: 34rpx; font-weight: 800; }
.summary-item:first-child .summary-item__value { color: #a33423; }
.summary-item__label { margin-top: 8rpx; color: #7c8286; font-size: 21rpx; }
.entry-form { margin-top: 24rpx; overflow: hidden; }
.entry-form__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 20rpx; padding: 26rpx 26rpx 22rpx; border-bottom: 1rpx solid #e0dfda; background: #ecebe6; }
.entry-form__title { display: block; color: #252d33; font-size: 29rpx; font-weight: 750; }
.entry-form__subtitle { display: block; margin-top: 6rpx; color: #747b80; font-size: 21rpx; }
.close-button, .remove-file, .more-action { display: flex; width: 64rpx; height: 64rpx; align-items: center; justify-content: center; border-radius: 50%; }
.close-button:active, .remove-file:active, .more-action:active { background: #deddd8; }
.form-body { padding: 26rpx; }
.rule-note { display: flex; gap: 14rpx; margin-bottom: 26rpx; padding: 18rpx; border-left: 6rpx solid #a43423; border-radius: 8rpx 14rpx 14rpx 8rpx; background: #f3e9e3; }
.rule-note__icon { display: flex; width: 54rpx; height: 54rpx; flex: 0 0 54rpx; align-items: center; justify-content: center; border-radius: 14rpx; background: #e7d2c8; }
.rule-note text:first-child { display: block; color: #443731; font-size: 24rpx; font-weight: 750; }
.rule-note text:last-child { display: block; margin-top: 5rpx; color: #75665e; font-size: 21rpx; line-height: 1.45; }
.compact-control { min-height: 84rpx; padding: 0 18rpx; font-size: 25rpx; }
.attendance-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12rpx; }
.attendance-grid .input-control { padding: 0 16rpx; text-align: center; }
.calculated-control { display: flex; min-height: 88rpx; align-items: center; justify-content: center; border: 1rpx solid #d6d5cf; border-radius: 16rpx; background: #ecebe6; color: #343d43; font-size: 28rpx; font-weight: 750; }
.calculated-control--accent { color: #a43423; }
.attendance-picker { margin-top: 6rpx; }
.field-heading-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 18rpx; margin-bottom: 12rpx; }
.field-heading-row .field-label { margin-bottom: 0; }
.field-help { display: block; margin-top: 5rpx; color: #858a8d; font-size: 20rpx; }
.field-actions { display: flex; flex: 0 0 auto; gap: 8rpx; }
.text-action { padding: 8rpx 12rpx; color: #9f3424; font-size: 20rpx; font-weight: 650; }
.text-action--muted { color: #72797e; }
.roster-scroll { width: 100%; margin-bottom: 12rpx; white-space: nowrap; }
.roster-row { display: inline-flex; gap: 10rpx; padding: 2rpx; }
.roster-chip { display: inline-flex; min-height: 64rpx; align-items: center; gap: 8rpx; padding: 0 18rpx; border: 1rpx solid #d3d2cc; border-radius: 999rpx; background: #f7f6f2; color: #596168; font-size: 22rpx; }
.roster-chip--selected { border-color: #b65d4d; background: #f3e3dc; color: #903021; font-weight: 700; }
.roster-empty { margin-bottom: 12rpx; padding: 18rpx; border: 1rpx dashed #d3d1ca; border-radius: 14rpx; color: #858a8d; font-size: 21rpx; line-height: 1.45; }
.paste-box { overflow: hidden; border: 1rpx solid #d3d2cc; border-radius: 16rpx; background: #fbfaf7; }
.attendee-textarea { box-sizing: border-box; width: 100%; height: 138rpx; padding: 18rpx; color: #31393f; font-size: 23rpx; line-height: 1.5; }
.recognize-button { display: flex; min-height: 66rpx; align-items: center; justify-content: center; gap: 8rpx; border-radius: 0; background: #39434b; color: #fff; font-size: 22rpx; font-weight: 700; }
.selected-attendees { margin-top: 12rpx; padding: 16rpx; border: 1rpx solid #cbd9d0; border-radius: 14rpx; background: #f0f6f2; }
.selected-attendees--empty { border-color: #ddd9d1; background: #f6f4ef; }
.selected-attendees__head { display: flex; align-items: center; justify-content: space-between; gap: 14rpx; }
.selected-attendees__head text:first-child { color: #30423a; font-size: 22rpx; font-weight: 750; }
.selected-attendees__head text:last-child { color: #76827b; font-size: 19rpx; text-align: right; }
.selected-chip-list { display: flex; flex-wrap: wrap; gap: 8rpx; margin-top: 14rpx; }
.selected-chip { display: inline-flex; min-height: 52rpx; align-items: center; gap: 6rpx; padding: 0 12rpx 0 15rpx; border-radius: 999rpx; background: #dfece4; color: #3b4d43; font-size: 20rpx; }
.upload-control { display: flex; width: 100%; min-height: 116rpx; align-items: center; gap: 16rpx; padding: 18rpx; border: 1rpx dashed #bcbab3; border-radius: 16rpx; background: #f8f7f3; text-align: left; }
.upload-control:active { background: #eeede8; }
.upload-control__icon { display: flex; width: 68rpx; height: 68rpx; flex: 0 0 68rpx; align-items: center; justify-content: center; border-radius: 16rpx; background: #e8dfd6; }
.upload-control__copy { min-width: 0; flex: 1; }
.upload-control__copy text:first-child { display: block; color: #343b41; font-size: 25rpx; font-weight: 700; }
.upload-control__copy text:last-child { display: block; margin-top: 5rpx; color: #888d90; font-size: 20rpx; }
.attachment-selected { display: flex; min-height: 104rpx; align-items: center; gap: 14rpx; padding: 16rpx; border: 1rpx solid #ccd8d1; border-radius: 16rpx; background: #f0f6f2; }
.file-mark { display: flex; width: 62rpx; height: 62rpx; flex: 0 0 62rpx; align-items: center; justify-content: center; border-radius: 14rpx; background: #dfece4; }
.attachment-selected__copy { min-width: 0; flex: 1; }
.attachment-selected__copy text:first-child { display: block; overflow: hidden; color: #2f3c35; font-size: 24rpx; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
.attachment-selected__copy text:last-child { display: block; margin-top: 5rpx; color: #718078; font-size: 20rpx; }
.form-error { display: flex; align-items: flex-start; gap: 10rpx; margin-bottom: 22rpx; padding: 18rpx; border-radius: 14rpx; background: #f9e5e1; color: #9e3021; font-size: 22rpx; line-height: 1.5; }
.button-row .btn:first-child { flex: .75; }
.button-row .btn:last-child { flex: 1.25; }
.filter-scroll { width: 100%; white-space: nowrap; }
.filter-row { display: inline-flex; gap: 12rpx; padding-bottom: 2rpx; }
.record-list { display: grid; gap: 18rpx; }
.record-item { overflow: hidden; }
.record-item__head { display: flex; align-items: center; gap: 16rpx; padding: 22rpx 22rpx 18rpx; }
.date-block { display: flex; width: 76rpx; height: 78rpx; flex: 0 0 76rpx; flex-direction: column; align-items: center; justify-content: center; border-radius: 17rpx; background: #303941; color: #f8f5ef; }
.date-block__day { font-size: 29rpx; font-weight: 800; line-height: 1; }
.date-block__month { margin-top: 5rpx; font-size: 19rpx; opacity: .78; }
.record-item__title { min-width: 0; flex: 1; }
.record-item__title text:first-child { display: block; color: #2a3137; font-size: 26rpx; font-weight: 700; }
.record-item__title text:last-child { display: block; margin-top: 7rpx; color: #80868a; font-size: 21rpx; }
.record-actions { display: flex; flex: 0 0 auto; }
.more-action { width: 54rpx; height: 54rpx; }
.attendance-line { padding: 0 22rpx 20rpx; }
.attendance-line__copy { display: flex; justify-content: space-between; margin-bottom: 10rpx; color: #636b70; font-size: 22rpx; }
.attendance-line__copy text:last-child { color: #30383e; font-weight: 750; }
.rate-track { height: 12rpx; overflow: hidden; border-radius: 999rpx; background: #e4e3de; }
.rate-fill { height: 100%; border-radius: 999rpx; transition: width 220ms ease-out; }
.rate-fill.good { background: #37735a; }
.rate-fill.medium { background: #aa7728; }
.rate-fill.low { background: #b6402e; }
.attendee-detail { margin: 0 22rpx 20rpx; padding: 16rpx; border-radius: 14rpx; background: #eef4f0; }
.attendee-detail__head { display: flex; justify-content: space-between; gap: 14rpx; color: #446052; font-size: 20rpx; font-weight: 700; }
.attendee-detail__names { display: block; margin-top: 8rpx; color: #66746c; font-size: 21rpx; line-height: 1.5; }
.legacy-warning { display: flex; align-items: center; gap: 12rpx; margin: 0 22rpx 20rpx; padding: 15rpx; border-radius: 14rpx; background: #fbefe4; color: #8f5a24; }
.legacy-warning view { min-width: 0; flex: 1; }
.legacy-warning text:first-child { display: block; font-size: 21rpx; font-weight: 750; }
.legacy-warning text:last-child { display: block; margin-top: 4rpx; color: #8c745d; font-size: 19rpx; }
.legacy-warning button { flex: 0 0 auto; padding: 10rpx 12rpx; color: #9f3424; font-size: 20rpx; font-weight: 700; }
.record-item__foot { display: flex; min-height: 74rpx; align-items: center; justify-content: space-between; gap: 14rpx; padding: 10rpx 22rpx; border-top: 1rpx solid #e1e0db; background: #f5f4ef; }
.case-count { display: flex; align-items: center; gap: 8rpx; color: #6b7277; font-size: 21rpx; white-space: nowrap; }
.attachment-links { display: flex; min-width: 0; align-items: center; justify-content: flex-end; gap: 14rpx; }
.attachment-link { display: flex; align-items: center; gap: 6rpx; color: #a53524; font-size: 20rpx; font-weight: 650; }
.attachment-missing { color: #9b8f82; font-size: 19rpx; }
</style>
