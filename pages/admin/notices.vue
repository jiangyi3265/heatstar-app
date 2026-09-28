<template>
  <view class="page-shell admin-shell">
    <AppHeader title="公告通知" :subtitle="`${publishedCount} 条已发布`" :back="true" :action-icon="canEdit ? 'plus' : ''" action-label="新建公告" @action="openCreate" />

    <view class="page-body">
      <view v-if="editorOpen && canEdit" class="notice-editor surface">
        <view class="editor-heading">
          <view>
            <text class="editor-title">{{ editingId ? '编辑公告' : '新建公告' }}</text>
            <text class="editor-subtitle">发布后将出现在小程序首页的公告区域</text>
          </view>
          <button class="close-button" aria-label="关闭" @tap="closeEditor"><AppIcon name="x" :size="34" tone="muted" /></button>
        </view>

        <view class="notice-preview">
          <view class="notice-preview__icon"><AppIcon name="speakerphone" :size="38" tone="inverse" /></view>
          <view class="notice-preview__copy">
            <view class="preview-title-line">
              <text v-if="form.top" class="top-tag">置顶</text>
              <text class="notice-preview__title">{{ form.title || '公告标题预览' }}</text>
            </view>
            <text class="notice-preview__summary">{{ form.summary || '在这里查看公告摘要效果。' }}</text>
          </view>
        </view>

        <view class="field-group">
          <view class="field-label">公告标题 <text class="field-required">*</text></view>
          <input v-model.trim="form.title" class="input-control" maxlength="40" placeholder="用一句话说明通知事项" />
          <text class="field-hint">{{ form.title.length }}/40</text>
        </view>
        <view class="field-group">
          <view class="field-label">公告内容 <text class="field-required">*</text></view>
          <textarea v-model.trim="form.summary" class="textarea-control" maxlength="300" placeholder="说明时间、参与对象与行动要求" />
          <text class="field-hint">{{ form.summary.length }}/300</text>
        </view>
        <view class="field-group">
          <view class="field-label">发布范围</view>
          <picker :range="scopeOptions" :value="scopeOptions.indexOf(form.scope)" @change="form.scope = scopeOptions[Number($event.detail.value)]">
            <view class="picker-control"><text>{{ form.scope }}</text><AppIcon name="chevron-down" :size="30" tone="muted" /></view>
          </picker>
        </view>
        <view class="switch-row">
          <view>
            <text class="switch-row__title">置顶展示</text>
            <text class="switch-row__desc">置顶公告在同状态列表中优先展示</text>
          </view>
          <switch color="#b93c28" :checked="form.top" @change="form.top = $event.detail.value" />
        </view>

        <view class="editor-actions">
          <button class="btn btn--secondary" @tap="saveNotice('草稿')"><AppIcon name="device-floppy" :size="31" />存为草稿</button>
          <button class="btn btn--primary" @tap="saveNotice('已发布')"><AppIcon name="speakerphone" :size="31" tone="inverse" />{{ editingStatus === '已发布' ? '发布更新' : '立即发布' }}</button>
        </view>
      </view>

      <view v-if="canEdit" class="notice-toolbar">
        <view class="notice-tabs">
          <button v-for="item in tabOptions" :key="item.value" class="notice-tab" :class="{ active: activeTab === item.value }" @tap="activeTab = item.value">
            {{ item.label }} <text class="mono-number">{{ countByTab(item.value) }}</text>
          </button>
        </view>
        <button class="create-button" @tap="openCreate"><AppIcon name="plus" :size="29" tone="inverse" />新建</button>
      </view>

      <view v-if="filteredNotices.length" class="notice-list">
        <view v-for="notice in filteredNotices" :key="notice.id" class="notice-row surface">
          <view class="notice-row__head">
            <view class="notice-status-line">
              <text class="status-pill" :class="notice.status === '已发布' ? 'published' : 'draft'">
                <text class="status-dot" />{{ notice.status }}
              </text>
              <text v-if="notice.top" class="top-pill"><AppIcon name="flag" :size="23" tone="accent" />置顶</text>
              <text class="scope-pill">{{ notice.scope || '全厂' }}</text>
            </view>
            <text class="notice-date mono-number">{{ notice.date }}</text>
          </view>
          <button class="notice-row__body" @tap="canEdit && openEdit(notice)">
            <text class="notice-title">{{ notice.title }}</text>
            <text class="notice-summary">{{ notice.summary }}</text>
          </button>
          <view v-if="canEdit" class="notice-actions">
            <button @tap="openEdit(notice)"><AppIcon name="edit" :size="29" tone="soft" />编辑</button>
            <button v-if="notice.status === '草稿'" class="publish-action" @tap="quickPublish(notice)"><AppIcon name="speakerphone" :size="29" tone="accent" />发布</button>
            <button v-else @tap="withdrawNotice(notice)"><AppIcon name="archive" :size="29" tone="soft" />转草稿</button>
            <button class="danger" @tap="removeNotice(notice)"><AppIcon name="trash" :size="29" tone="accent" />删除</button>
          </view>
        </view>
      </view>

      <view v-else class="empty-state surface">
        <AppIcon name="bell" :size="64" tone="muted" />
        <view class="empty-state__title">{{ activeTab === 'all' ? '暂无公告' : `暂无${activeTab}` }}</view>
        <view class="empty-state__text">{{ canEdit ? '新建公告可先保存草稿，确认内容后再发布。' : '厂里发布通知后会显示在这里。' }}</view>
        <button v-if="canEdit" class="empty-create" @tap="openCreate">新建公告</button>
      </view>
    </view>
  </view>
</template>

<script>
import AppHeader from '../../components/AppHeader.vue'
import AppIcon from '../../components/AppIcon.vue'

import { readStorage, writeStorage, STORAGE_KEYS, formatNow } from '../../utils/storage.js'
import { ensureSynchronized } from '../../utils/api.js'
import { isAdmin } from '../../utils/session.js'

const emptyForm = () => ({ title: '', summary: '', scope: '全厂', top: false })

export default {
  components: { AppHeader, AppIcon },
  data() {
    return {
      // 全厂都能看公告，只有管理员能新建和编辑。
      canEdit: isAdmin(),
      notices: [],
      activeTab: 'all',
      editorOpen: false,
      editingId: '',
      editingStatus: '草稿',
      form: emptyForm(),
      teams: [],
      tabOptions: [
        { value: 'all', label: '全部' },
        { value: '已发布', label: '已发布' },
        { value: '草稿', label: '草稿' }
      ]
    }
  },
  computed: {
    publishedCount() {
      return this.notices.filter(item => item.status === '已发布').length
    },
    // 发布范围跟着后台维护的工段走，新增工段后无需改代码
    scopeOptions() {
      const sections = Array.from(new Set(this.teams.map(item => item.section).filter(name => name && name !== '厂级职能')))
      return ['全厂', ...sections]
    },
    filteredNotices() {
      // 员工只看到已发布的，草稿不外露。
      const source = this.canEdit ? this.notices : this.notices.filter(item => item.status === '已发布')
      const list = !this.canEdit || this.activeTab === 'all' ? source : source.filter(item => item.status === this.activeTab)
      return [...list].sort((a, b) => Number(Boolean(b.top)) - Number(Boolean(a.top)) || String(b.date).localeCompare(String(a.date)))
    }
  },
  async onShow() {
    await ensureSynchronized()
    this.canEdit = isAdmin()
    this.teams = readStorage(STORAGE_KEYS.teams, [])
    this.notices = readStorage(STORAGE_KEYS.notices, []).map(item => ({ scope: '全厂', ...item }))
  },
  methods: {
    countByTab(tab) {
      return tab === 'all' ? this.notices.length : this.notices.filter(item => item.status === tab).length
    },
    openCreate() {
      this.editingId = ''
      this.editingStatus = '草稿'
      this.form = emptyForm()
      this.editorOpen = true
    },
    openEdit(notice) {
      this.editingId = notice.id
      this.editingStatus = notice.status
      this.form = { title: notice.title, summary: notice.summary, scope: notice.scope || '全厂', top: Boolean(notice.top) }
      this.editorOpen = true
    },
    closeEditor() {
      this.editorOpen = false
      this.editingId = ''
      this.form = emptyForm()
    },
    validate() {
      if (!this.form.title) return '请输入公告标题'
      if (!this.form.summary) return '请输入公告内容'
      return ''
    },
    saveNotice(status) {
      const error = this.validate()
      if (error) {
        uni.showToast({ title: error, icon: 'none' })
        return
      }
      const existing = this.notices.find(item => item.id === this.editingId)
      const payload = {
        ...existing,
        ...this.form,
        id: this.editingId || `N${Date.now()}`,
        status,
        date: formatNow().slice(0, 10),
        updatedAt: formatNow()
      }
      const index = this.notices.findIndex(item => item.id === this.editingId)
      if (index >= 0) this.notices.splice(index, 1, payload)
      else this.notices.unshift(payload)
      this.persist()
      this.closeEditor()
      this.activeTab = status
      uni.showToast({ title: status === '已发布' ? '公告已发布' : '草稿已保存', icon: 'success' })
    },
    quickPublish(notice) {
      uni.showModal({
        title: '确认发布公告？',
        content: `「${notice.title}」将发布至${notice.scope || '全厂'}。`,
        confirmText: '发布',
        confirmColor: '#b93c28',
        success: result => {
          if (!result.confirm) return
          notice.status = '已发布'
          notice.date = formatNow().slice(0, 10)
          notice.updatedAt = formatNow()
          this.persist()
          uni.showToast({ title: '公告已发布', icon: 'success' })
        }
      })
    },
    withdrawNotice(notice) {
      uni.showModal({
        title: '转为草稿？',
        content: '操作后首页将不再展示该公告，内容会保留在草稿中。',
        confirmText: '转草稿',
        success: result => {
          if (!result.confirm) return
          notice.status = '草稿'
          notice.updatedAt = formatNow()
          this.persist()
          uni.showToast({ title: '已转为草稿', icon: 'none' })
        }
      })
    },
    removeNotice(notice) {
      uni.showModal({
        title: '删除公告？',
        content: `「${notice.title}」删除后无法恢复。`,
        confirmText: '删除',
        confirmColor: '#a83222',
        success: result => {
          if (!result.confirm) return
          this.notices = this.notices.filter(item => item.id !== notice.id)
          this.persist()
          uni.showToast({ title: '已删除', icon: 'success' })
        }
      })
    },
    persist() {
      writeStorage(STORAGE_KEYS.notices, this.notices)
    }
  }
}
</script>

<style scoped>
.notice-editor { padding: 26rpx 22rpx; }
.editor-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16rpx; margin-bottom: 22rpx; }
.editor-title { display: block; color: #283036; font-size: 29rpx; font-weight: 740; }
.editor-subtitle { display: block; margin-top: 5rpx; color: #7d8286; font-size: 20rpx; }
.close-button { display: flex; width: 58rpx; height: 58rpx; align-items: center; justify-content: center; border-radius: 50%; }
.close-button:active { background: #ecebe6; }
.notice-preview { display: flex; align-items: flex-start; gap: 15rpx; margin-bottom: 26rpx; padding: 18rpx; border: 1rpx solid #d8d7d1; border-radius: 16rpx; background: #f3f2ee; text-align: left; }
.notice-preview__icon { display: flex; width: 64rpx; height: 64rpx; flex: 0 0 auto; align-items: center; justify-content: center; border-radius: 16rpx; background: #b93c28; }
.notice-preview__copy { min-width: 0; flex: 1; }
.preview-title-line { display: flex; align-items: center; gap: 8rpx; }
.top-tag { padding: 3rpx 7rpx; border-radius: 6rpx; background: #f0d9d4; color: #9d3525; font-size: 16rpx; font-weight: 700; }
.notice-preview__title { overflow: hidden; color: #293036; font-size: 25rpx; font-weight: 720; text-overflow: ellipsis; white-space: nowrap; }
.notice-preview__summary { display: -webkit-box; margin-top: 7rpx; overflow: hidden; color: #71787c; font-size: 20rpx; line-height: 1.5; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.switch-row { display: flex; min-height: 92rpx; align-items: center; justify-content: space-between; gap: 20rpx; padding: 14rpx 18rpx; border: 1rpx solid #d8d7d1; border-radius: 15rpx; background: #f7f6f2; }
.switch-row__title { display: block; color: #30373d; font-size: 25rpx; font-weight: 700; }
.switch-row__desc { display: block; margin-top: 4rpx; color: #808589; font-size: 19rpx; }
.editor-actions { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12rpx; margin-top: 22rpx; }
.notice-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 14rpx; margin: 24rpx 0 16rpx; }
.notice-tabs { display: flex; min-width: 0; gap: 8rpx; }
.notice-tab { min-height: 60rpx; padding: 0 16rpx; border: 1rpx solid #d5d4ce; border-radius: 999rpx; color: #666d72; font-size: 21rpx; font-weight: 650; }
.notice-tab.active { border-color: #b93c28; background: #f5e6e2; color: #9b3525; }
.notice-tab text { margin-left: 3rpx; opacity: .75; }
.create-button { display: flex; min-height: 62rpx; align-items: center; gap: 6rpx; padding: 0 17rpx; border-radius: 14rpx; background: #293740; color: #f8f6f1; font-size: 22rpx; font-weight: 700; white-space: nowrap; }
.notice-list { display: flex; flex-direction: column; gap: 14rpx; }
.notice-row { overflow: hidden; }
.notice-row__head { display: flex; align-items: center; justify-content: space-between; gap: 12rpx; padding: 18rpx 20rpx 0; }
.notice-status-line { display: flex; min-width: 0; align-items: center; gap: 8rpx; }
.status-pill, .top-pill, .scope-pill { display: inline-flex; min-height: 40rpx; align-items: center; gap: 5rpx; padding: 0 10rpx; border-radius: 999rpx; font-size: 17rpx; font-weight: 680; white-space: nowrap; }
.status-pill.published { background: #e4f0e8; color: #296247; }
.status-pill.draft { background: #eae9e4; color: #646a6f; }
.status-dot { width: 9rpx; height: 9rpx; border-radius: 50%; background: currentColor; }
.top-pill { background: #f5e3df; color: #9e3727; }
.scope-pill { overflow: hidden; max-width: 150rpx; background: #eeeef0; color: #656b70; text-overflow: ellipsis; }
.notice-date { color: #929699; font-size: 18rpx; white-space: nowrap; }
.notice-row__body { display: block; width: 100%; padding: 16rpx 20rpx 22rpx; text-align: left; }
.notice-row__body:active { background: #f2f1ec; }
.notice-title { display: block; color: #293036; font-size: 28rpx; font-weight: 730; line-height: 1.35; }
.notice-summary { display: -webkit-box; margin-top: 9rpx; overflow: hidden; color: #71787c; font-size: 21rpx; line-height: 1.55; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.notice-actions { display: grid; grid-template-columns: repeat(3, 1fr); border-top: 1rpx solid #e2e1dc; }
.notice-actions button { display: flex; min-height: 68rpx; align-items: center; justify-content: center; gap: 7rpx; color: #596167; font-size: 20rpx; font-weight: 650; }
.notice-actions button + button { border-left: 1rpx solid #e2e1dc; }
.notice-actions button:active { background: #efeee9; }
.notice-actions .publish-action, .notice-actions .danger { color: #a03a2a; }
.empty-state :deep(.app-icon) { margin: 0 auto; }
.empty-create { min-height: 66rpx; margin: 22rpx auto 0; padding: 0 24rpx; border-radius: 14rpx; background: #293740; color: #f8f6f1; font-size: 23rpx; font-weight: 700; }

/* PC-FONT-BOOST */
/* 电脑上把手机基准的小字提到可读尺寸。 */
@media (min-width: 860px) {
  .editor-subtitle { font-size: 12px; }
  .top-tag { font-size: 12px; }
  .notice-preview__summary { font-size: 12px; }
  .switch-row__desc { font-size: 12px; }
  .notice-tab { font-size: 13px; }
  .create-button { font-size: 13px; }
  .status-pill, .top-pill, .scope-pill { font-size: 12px; }
  .notice-date { font-size: 12px; }
  .notice-summary { font-size: 13px; }
  .notice-actions button { font-size: 12px; }
  .empty-create { font-size: 14px; }
}
</style>
