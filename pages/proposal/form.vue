<template>
  <view class="page-shell">
    <AppHeader
      :title="isEditing ? '修改提案' : '填写提案'"
      :subtitle="`${typeLabel} · 第 2 步，共 2 步`"
      :back="true"
    />

    <view class="page-body form-page">
      <view class="form-context">
        <view class="type-lock">
          <view class="type-lock__icon">
            <AppIcon :name="typeIcon" :size="36" tone="inverse" />
          </view>
          <view class="type-lock__copy">
            <text class="type-lock__label">{{ typeLabel }}</text>
            <text class="type-lock__hint">类型已选定，正式提交后不可修改</text>
          </view>
          <AppIcon name="shield-lock" :size="32" tone="muted" />
        </view>
        <view class="draft-state">
          <view class="draft-state__signal" :class="{ 'draft-state__signal--saved': draftSavedAt }" />
          <text>{{ draftSavedAt ? `草稿已于 ${draftSavedAt} 自动保存` : '内容将自动保存到本机' }}</text>
        </view>
      </view>

      <view v-if="isEditing && originalRejectReason" class="reject-notice">
        <view class="reject-notice__heading">
          <AppIcon name="alert-triangle" :size="34" tone="accent" />
          <text>请根据驳回意见补充后重提</text>
        </view>
        <text class="reject-notice__reason">{{ originalRejectReason }}</text>
        <text class="reject-notice__number">原编号 {{ originalNumber }} 将继续保留</text>
      </view>

      <template v-if="isImprovementType">
      <view v-if="type === 'six'" class="form-section surface">
        <view class="form-section__heading">
          <view>
            <text class="form-section__index">01</text>
            <text class="form-section__title">六源识别</text>
          </view>
          <text class="form-section__hint">可多选</text>
        </view>

        <view class="number-field">
          <text class="number-field__label">六源编号</text>
          <text class="number-field__value mono-number">{{ form.sourceNo }}</text>
          <text class="number-field__note">系统自动生成</text>
        </view>

        <view class="field-group category-field">
          <view class="field-label"><text>六源分类</text><text class="field-required">*</text></view>
          <view class="category-grid">
            <button
              v-for="item in sourceCategories"
              :key="item.id"
              class="category-option"
              :class="{ 'category-option--active': form.categories.includes(item.name) }"
              @tap="toggleCategory(item.name)"
            >
              <view class="category-option__icon" :style="{ backgroundColor: `${item.color}18` }">
                <AppIcon :name="item.icon" :size="38" :tone="form.categories.includes(item.name) ? 'accent' : 'soft'" />
              </view>
              <text class="category-option__name">{{ item.name }}</text>
              <AppIcon v-if="form.categories.includes(item.name)" name="circle-check" :size="28" tone="accent" />
            </button>
          </view>
          <text class="field-hint">选择问题最主要的来源，可按现场情况勾选多个分类。</text>
        </view>
      </view>

      <view class="form-section surface">
        <view class="form-section__heading">
          <view>
            <text class="form-section__index">{{ type === 'six' ? '02' : '01' }}</text>
            <text class="form-section__title">基本信息</text>
          </view>
          <text class="form-section__hint"><text class="field-required">*</text> 为必填</text>
        </view>

        <view class="field-group">
          <view class="field-label"><text>提案名称</text><text class="field-required">*</text></view>
          <input v-model.trim="form.title" class="input-control" maxlength="60" placeholder="用一句话说明改善内容" />
          <view class="field-footer"><text>建议包含对象与改善动作</text><text>{{ form.title.length }}/60</text></view>
        </view>

        <template v-if="type === 'lean'">
          <view class="field-group">
            <view class="field-label"><text>项目类型</text><text class="field-required">*</text></view>
            <view class="chip-row">
              <button
                v-for="item in projectTypes"
                :key="item"
                class="chip"
                :class="{ 'chip--active': form.projectType === item }"
                @tap="form.projectType = item"
              >{{ item }}</button>
            </view>
          </view>
        </template>

        <template v-else>
          <view class="two-column field-row">
            <view class="field-group">
              <view class="field-label"><text>发现人</text><text class="field-required">*</text></view>
              <input v-model.trim="form.discoverer" class="input-control" maxlength="20" placeholder="姓名" />
            </view>
            <view class="field-group">
              <view class="field-label"><text>发现日期</text><text class="field-required">*</text></view>
              <picker mode="date" :value="form.discoverDate" @change="setDate('discoverDate', $event)">
                <view class="picker-control">
                  <text :class="{ placeholder: !form.discoverDate }">{{ form.discoverDate || '选择日期' }}</text>
                  <AppIcon name="calendar" :size="32" tone="muted" />
                </view>
              </picker>
            </view>
          </view>
        </template>

        <view class="two-column field-row">
          <view class="field-group">
            <view class="field-label"><text>所属班组</text><text class="field-required">*</text></view>
            <picker :range="teamNames" :value="teamIndex" @change="setPickerValue('team', teamNames, $event)">
              <view class="picker-control">
                <text :class="{ placeholder: !form.team }">{{ form.team || '选择班组' }}</text>
                <AppIcon name="chevron-down" :size="28" tone="muted" />
              </view>
            </picker>
          </view>
          <view class="field-group">
            <view class="field-label"><text>第一作者</text><text class="field-required">*</text></view>
            <input v-model.trim="form.firstAuthor" class="input-control" maxlength="20" placeholder="姓名" />
          </view>
        </view>

        <view class="field-group">
          <view class="field-label"><text>团队成员</text><text class="optional-label">选填</text></view>
          <input v-model.trim="form.members" class="input-control" maxlength="100" placeholder="多人请使用顿号分隔" />
        </view>
      </view>

      <view class="form-section surface">
        <view class="form-section__heading">
          <view>
            <text class="form-section__index">{{ type === 'six' ? '03' : '02' }}</text>
            <text class="form-section__title">改善证据</text>
          </view>
          <text class="form-section__hint">单张不超过 20MB</text>
        </view>

        <PhotoUploader v-model="form.beforePhotos" label="改善前照片" :required="true" :max="3" />
        <view class="photo-divider"><text>改善后</text></view>
        <PhotoUploader v-model="form.afterPhotos" label="改善后照片" :required="true" :max="3" />
      </view>

      <view class="form-section surface">
        <view class="form-section__heading">
          <view>
            <text class="form-section__index">{{ type === 'six' ? '04' : '03' }}</text>
            <text class="form-section__title">{{ type === 'six' ? '问题与措施' : '改善说明' }}</text>
          </view>
        </view>

        <template v-if="type === 'lean'">
          <view class="field-group">
            <view class="field-label"><text>改善前说明</text><text class="field-required">*</text></view>
            <textarea v-model.trim="form.beforeText" class="textarea-control" maxlength="500" placeholder="说明现状、影响与改进必要性" />
            <view class="field-footer"><text>尽量包含可核对的现状数据</text><text>{{ form.beforeText.length }}/500</text></view>
          </view>
          <view class="field-group">
            <view class="field-label"><text>改善后说明</text><text class="field-required">*</text></view>
            <textarea v-model.trim="form.afterText" class="textarea-control" maxlength="500" placeholder="说明实施方法、变化与实际效果" />
            <view class="field-footer"><text>说明改善结果和推广价值</text><text>{{ form.afterText.length }}/500</text></view>
          </view>
        </template>

        <template v-else>
          <view class="field-group">
            <view class="field-label"><text>问题描述</text><text class="field-required">*</text></view>
            <textarea v-model.trim="form.problem" class="textarea-control" maxlength="500" placeholder="说明发现的问题、影响与风险" />
            <view class="field-footer"><text>建议包含发生位置与影响范围</text><text>{{ form.problem.length }}/500</text></view>
          </view>
          <view class="field-group">
            <view class="field-label"><text>改善措施</text><text class="field-required">*</text></view>
            <textarea v-model.trim="form.measures" class="textarea-control" maxlength="500" placeholder="说明采取的措施与处理结果" />
            <view class="field-footer"><text>措施应与改善后照片一致</text><text>{{ form.measures.length }}/500</text></view>
          </view>
        </template>
      </view>

      <view v-if="type === 'six'" class="form-section surface">
        <view class="form-section__heading">
          <view>
            <text class="form-section__index">05</text>
            <text class="form-section__title">闭环责任</text>
          </view>
        </view>

        <view class="field-group">
          <view class="field-label"><text>解决单位</text><text class="field-required">*</text></view>
          <picker :range="solvingUnits" @change="setPickerValue('solvingUnit', solvingUnits, $event)">
            <view class="picker-control">
              <text :class="{ placeholder: !form.solvingUnit }">{{ form.solvingUnit || '选择解决单位' }}</text>
              <AppIcon name="chevron-down" :size="28" tone="muted" />
            </view>
          </picker>
        </view>

        <view class="two-column field-row">
          <view class="field-group">
            <view class="field-label"><text>解决人</text><text class="field-required">*</text></view>
            <input v-model.trim="form.solver" class="input-control" maxlength="20" placeholder="姓名" />
          </view>
          <view class="field-group">
            <view class="field-label"><text>改善日期</text><text class="field-required">*</text></view>
            <picker mode="date" :value="form.improveDate" @change="setDate('improveDate', $event)">
              <view class="picker-control">
                <text :class="{ placeholder: !form.improveDate }">{{ form.improveDate || '选择日期' }}</text>
                <AppIcon name="calendar" :size="32" tone="muted" />
              </view>
            </picker>
          </view>
        </view>
      </view>

      <view class="form-section surface amount-section">
        <view class="form-section__heading">
          <view>
            <text class="form-section__index">{{ type === 'six' ? '06' : '04' }}</text>
            <text class="form-section__title">价值估算</text>
          </view>
          <text class="form-section__hint">允许填 0</text>
        </view>
        <view class="field-group amount-field">
          <view class="field-label"><text>{{ type === 'six' ? '改善节约成本金额' : '节省金额' }}</text></view>
          <view class="amount-control">
            <text class="amount-control__currency">¥</text>
            <input v-model.trim="form.savedAmount" type="digit" maxlength="12" placeholder="0.00" />
            <text class="amount-control__unit">元</text>
          </view>
          <text class="field-hint">无法折算金额时填写 0，后续可由审核人核实。</text>
        </view>
      </view>
      </template>

      <template v-else-if="type === 'tool'">
        <view class="form-section surface">
          <view class="form-section__heading">
            <view><text class="form-section__index">01</text><text class="form-section__title">工具信息</text></view>
            <text class="form-section__hint"><text class="field-required">*</text> 为必填</text>
          </view>
          <view class="field-group">
            <view class="field-label"><text>工具名称</text><text class="field-required">*</text></view>
            <input v-model.trim="form.title" class="input-control" maxlength="80" placeholder="填写工具、工装或辅具名称" />
          </view>
          <view class="field-group">
            <view class="field-label"><text>工具类别</text><text class="field-required">*</text></view>
            <view class="chip-row">
              <button v-for="item in toolCategories" :key="item" class="chip" :class="{ 'chip--active': form.toolCategory === item }" @tap="form.toolCategory = item">{{ item }}</button>
            </view>
          </view>
          <view class="two-column field-row">
            <view class="field-group">
              <view class="field-label"><text>所属班组</text><text class="field-required">*</text></view>
              <picker :range="teamNames" :value="teamIndex" @change="setPickerValue('team', teamNames, $event)">
                <view class="picker-control"><text :class="{ placeholder: !form.team }">{{ form.team || '选择班组' }}</text><AppIcon name="chevron-down" :size="28" tone="muted" /></view>
              </picker>
            </view>
            <view class="field-group">
              <view class="field-label"><text>开发人员</text><text class="field-required">*</text></view>
              <input v-model.trim="form.firstAuthor" class="input-control" maxlength="20" placeholder="姓名" />
            </view>
          </view>
          <view class="two-column field-row">
            <view class="field-group">
              <view class="field-label"><text>开发日期</text><text class="field-required">*</text></view>
              <picker mode="date" :value="form.developmentDate" @change="setDate('developmentDate', $event)">
                <view class="picker-control"><text :class="{ placeholder: !form.developmentDate }">{{ form.developmentDate || '选择日期' }}</text><AppIcon name="calendar" :size="32" tone="muted" /></view>
              </picker>
            </view>
            <view class="field-group">
              <view class="field-label"><text>使用范围</text><text class="field-required">*</text></view>
              <input v-model.trim="form.usageScope" class="input-control" maxlength="60" placeholder="例如：链条管理" />
            </view>
          </view>
        </view>

        <view class="form-section surface">
          <view class="form-section__heading"><view><text class="form-section__index">02</text><text class="form-section__title">设计与效果</text></view></view>
          <view class="field-group">
            <view class="field-label"><text>设计思路说明</text><text class="field-required">*</text></view>
            <textarea v-model.trim="form.designIdea" class="textarea-control" maxlength="800" placeholder="说明要解决的问题、结构设计和制作思路" />
          </view>
          <view class="field-group">
            <view class="field-label"><text>运用效果说明</text><text class="field-required">*</text></view>
            <textarea v-model.trim="form.applicationEffect" class="textarea-control" maxlength="800" placeholder="说明实际使用效果、效率或管理变化" />
          </view>
        </view>

        <view class="form-section surface">
          <view class="form-section__heading"><view><text class="form-section__index">03</text><text class="form-section__title">工具照片</text></view><text class="form-section__hint">对应模板上下两张图</text></view>
          <PhotoUploader v-model="form.beforePhotos" label="开发前或设计照片" :required="true" :max="3" />
          <view class="photo-divider"><text>应用效果</text></view>
          <PhotoUploader v-model="form.afterPhotos" label="成品或现场应用照片" :required="true" :max="3" />
        </view>
      </template>

      <template v-else>
        <view class="form-section surface">
          <view class="form-section__heading"><view><text class="form-section__index">01</text><text class="form-section__title">OPL 基本信息</text></view><text class="form-section__hint"><text class="field-required">*</text> 为必填</text></view>
          <view class="number-field">
            <text class="number-field__label">OPL 编号</text>
            <text class="number-field__value mono-number">{{ form.sourceNo }}</text>
            <text class="number-field__note">系统自动生成</text>
          </view>
          <view class="field-group">
            <view class="field-label"><text>名称</text><text class="field-required">*</text></view>
            <input v-model.trim="form.title" class="input-control" maxlength="80" placeholder="填写本次单点课程名称" />
          </view>
          <view class="two-column field-row">
            <view class="field-group">
              <view class="field-label"><text>编者</text><text class="field-required">*</text></view>
              <input v-model.trim="form.firstAuthor" class="input-control" maxlength="20" placeholder="姓名" />
            </view>
            <view class="field-group">
              <view class="field-label"><text>编制日期</text><text class="field-required">*</text></view>
              <picker mode="date" :value="form.oplDate" @change="setDate('oplDate', $event)">
                <view class="picker-control"><text :class="{ placeholder: !form.oplDate }">{{ form.oplDate || '选择日期' }}</text><AppIcon name="calendar" :size="32" tone="muted" /></view>
              </picker>
            </view>
          </view>
          <view class="two-column field-row">
            <view class="field-group">
              <view class="field-label"><text>所属班组</text><text class="field-required">*</text></view>
              <picker :range="teamNames" :value="teamIndex" @change="setPickerValue('team', teamNames, $event)">
                <view class="picker-control"><text :class="{ placeholder: !form.team }">{{ form.team || '选择班组' }}</text><AppIcon name="chevron-down" :size="28" tone="muted" /></view>
              </picker>
            </view>
            <view class="field-group">
              <view class="field-label"><text>岗位</text><text class="field-required">*</text></view>
              <input v-model.trim="form.position" class="input-control" maxlength="30" placeholder="例如：热处理工" />
            </view>
          </view>
          <view class="field-group">
            <view class="field-label"><text>类别</text><text class="field-required">*</text></view>
            <view class="chip-row">
              <button v-for="item in oplCategories" :key="item" class="chip" :class="{ 'chip--active': form.oplCategory === item }" @tap="form.oplCategory = item">{{ item }}</button>
            </view>
            <input v-if="form.oplCategory === '其他'" v-model.trim="form.otherCategory" class="input-control other-category" maxlength="30" placeholder="填写其他类别" />
          </view>
        </view>

        <view class="form-section surface">
          <view class="form-section__heading"><view><text class="form-section__index">02</text><text class="form-section__title">课程步骤</text></view><text class="form-section__hint">每步图片和说明必填</text></view>
          <view class="opl-step-editor">
            <view v-for="(step, index) in form.oplSteps" :key="step.key" class="opl-step-edit">
              <view class="opl-step-edit__head">
                <view>
                  <text class="opl-step-edit__number">步骤 {{ index + 1 }}</text>
                  <text>一张图片对应一段说明</text>
                </view>
                <button class="opl-step-edit__remove" :aria-label="`删除步骤 ${index + 1}`" @tap="removeOplStep(index)">
                  <AppIcon name="trash" :size="28" />
                  <text>删除</text>
                </button>
              </view>
              <PhotoUploader
                :model-value="step.photo ? [step.photo] : []"
                label="步骤图片"
                :required="true"
                :max="1"
                @update:modelValue="setOplStepPhoto(index, $event)"
              />
              <view class="field-group opl-step-edit__description">
                <view class="field-label"><text>步骤说明</text><text class="field-required">*</text></view>
                <textarea v-model.trim="step.text" class="textarea-control" maxlength="600" placeholder="说明这一步做什么、怎么做及注意事项" />
                <view class="field-footer"><text>图片与本段文字将成对保存和导出</text><text>{{ step.text.length }}/600</text></view>
              </view>
            </view>
          </view>
          <button class="opl-step-add" @tap="addOplStep">
            <AppIcon name="plus" :size="30" />
            <text>添加下一步</text>
          </button>
        </view>

        <view class="form-section surface">
          <view class="form-section__heading"><view><text class="form-section__index">03</text><text class="form-section__title">培训记录</text></view></view>
          <view class="two-column field-row">
            <view class="field-group"><view class="field-label"><text>讲师</text><text class="field-required">*</text></view><input v-model.trim="form.lecturer" class="input-control" maxlength="20" placeholder="姓名" /></view>
            <view class="field-group"><view class="field-label"><text>培训日期</text><text class="field-required">*</text></view><picker mode="date" :value="form.trainingDate" @change="setDate('trainingDate', $event)"><view class="picker-control"><text :class="{ placeholder: !form.trainingDate }">{{ form.trainingDate || '选择日期' }}</text><AppIcon name="calendar" :size="32" tone="muted" /></view></picker></view>
          </view>
          <view class="field-group"><view class="field-label"><text>受训人员</text><text class="field-required">*</text></view><input v-model.trim="form.trainees" class="input-control" maxlength="150" placeholder="填写人员、岗位或班组" /></view>
          <view class="field-group">
            <view class="field-label"><text>培训总体评价</text><text class="field-required">*</text></view>
            <view class="evaluation-grid">
              <button v-for="item in trainingEvaluations" :key="item" class="chip" :class="{ 'chip--active': form.trainingEvaluation === item }" @tap="form.trainingEvaluation = item">{{ item }}</button>
            </view>
          </view>
          <text class="field-hint">班组长和评审小组的评审人员由系统记录，无需提交人填写。</text>
        </view>
      </template>
    </view>

    <view class="sticky-actions">
      <button class="btn btn--secondary" @tap="saveDraftManually">
        <AppIcon name="device-floppy" :size="32" />
        <text>存草稿</text>
      </button>
      <button class="btn btn--primary submit-button" :disabled="submitting" @tap="confirmSubmit">
        <text>{{ submitting ? '正在提交' : isEditing ? '重新提交' : '提交审核' }}</text>
        <AppIcon name="check" :size="32" tone="inverse" />
      </button>
    </view>
  </view>
</template>

<script>
import AppHeader from '../../components/AppHeader.vue'
import AppIcon from '../../components/AppIcon.vue'
import PhotoUploader from '../../components/PhotoUploader.vue'
import { sections as seedSections, sourceCategories, teams as seedTeams } from '../../utils/mock.js'
import { departmentId, departmentName } from '../../utils/organization.js'
import { formatNow, getProposals, nextProposalNo, saveProposalConfirmed, readStorage, STORAGE_KEYS } from '../../utils/storage.js'
import { ensureSynchronized, reserveProposalNumber } from '../../utils/api.js'
import { isProposalType, proposalOplSteps, proposalTypeIcon, proposalTypeLabel } from '../../utils/proposal-types.js'
import { currentUser } from '../../utils/session.js'

let oplStepSequence = 0

function createOplStep(photo = '', text = '') {
  oplStepSequence += 1
  return { key: `opl-step-${Date.now()}-${oplStepSequence}`, photo, text }
}

function createEmptyForm() {
  return {
    sourceNo: '',
    categories: [],
    title: '',
    projectType: '',
    discoverer: '',
    discoverDate: '',
    team: '',
    firstAuthor: '',
    members: '',
    beforePhotos: [],
    afterPhotos: [],
    beforeText: '',
    afterText: '',
    problem: '',
    measures: '',
    solvingUnit: '',
    solver: '',
    improveDate: '',
    toolCategory: '',
    developmentDate: '',
    usageScope: '',
    designIdea: '',
    applicationEffect: '',
    oplDate: '',
    position: '',
    oplCategory: '',
    otherCategory: '',
    contentText: '',
    oplSteps: [createOplStep()],
    lecturer: '',
    trainingDate: '',
    trainees: '',
    trainingEvaluation: '',
    savedAmount: '0'
  }
}

function dateOnly() {
  const now = new Date()
  const pad = value => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export default {
  components: { AppHeader, AppIcon, PhotoUploader },
  data() {
    // 班组和工段以后台维护的组织为准，没配过再退回种子数据。
    const teams = (readStorage(STORAGE_KEYS.teams, seedTeams) || seedTeams).filter(t => departmentId(t) === departmentId(currentUser()))
    const sectionNames = Array.from(new Set(teams.map(item => item.section).filter(Boolean)))
    return {
      user: currentUser() || {},
      teams,
      type: 'lean',
      form: createEmptyForm(),
      sourceCategories,
      projectTypes: ['效率', '质量', '成本', '安全', '现场管理', '节能环保'],
      toolCategories: ['工装', '辅具'],
      oplCategories: ['基础知识', '工作技巧', '改善事项', '故障处理', '其他'],
      trainingEvaluations: ['知道但不会做', '在帮助下会做', '能独立进行', '能教别人'],
      teamNames: teams.map(item => item.name),
      solvingUnits: [...(sectionNames.length ? sectionNames : seedSections.map(item => item.name)), ...teams.map(item => item.name)],
      editingProposal: null,
      originalRejectReason: '',
      initialized: false,
      draftTimer: null,
      draftSavedAt: '',
      submitting: false
    }
  },
  computed: {
    typeLabel() {
      return proposalTypeLabel(this.type, true)
    },
    typeIcon() {
      return proposalTypeIcon(this.type)
    },
    isImprovementType() {
      return ['lean', 'six'].includes(this.type)
    },
    isEditing() {
      return Boolean(this.editingProposal)
    },
    originalNumber() {
      if (!this.editingProposal) return ''
      return this.editingProposal.sourceNo || this.editingProposal.id
    },
    draftKey() {
      // 草稿按账号隔离，换人登录不会串到别人的未提交内容。
      const owner = this.user.workNo || 'anonymous'
      return this.isEditing
        ? `heatstar_proposal_draft_edit_${owner}_${this.editingProposal.id}`
        : `heatstar_proposal_draft_${owner}_${this.type}`
    },
    teamIndex() {
      const index = this.teamNames.indexOf(this.form.team)
      return index < 0 ? 0 : index
    }
  },
  watch: {
    form: {
      deep: true,
      handler() {
        if (!this.initialized || this.submitting) return
        clearTimeout(this.draftTimer)
        this.draftTimer = setTimeout(() => this.persistDraft(false), 500)
      }
    }
  },
  async onLoad(options) {
    await ensureSynchronized()
    this.user = currentUser() || {}
    this.teams = readStorage(STORAGE_KEYS.teams, []).filter(t => departmentId(t) === departmentId(this.user))
    this.teamNames = this.teams.map(t => t.name)
    this.solvingUnits = [...new Set(this.teams.map(t => t.section).filter(Boolean)), ...this.teamNames]
    const requestedType = isProposalType(options.type) ? options.type : 'lean'
    const rawId = options.id ? decodeURIComponent(options.id) : ''
    const existing = rawId ? getProposals().find(item => item.id === rawId) : null

    if (existing) {
      if (existing.status !== 'rejected') {
        uni.showToast({ title: '仅被驳回提案可修改', icon: 'none' })
        setTimeout(() => uni.navigateBack(), 600)
        return
      }
      this.editingProposal = existing
      this.type = existing.type
      this.originalRejectReason = existing.rejectReason || ''
      this.form = this.normalizedForm(existing)
    } else {
      this.type = requestedType
      this.form = createEmptyForm()
      this.form.team = this.user.team || ''
      this.form.firstAuthor = this.user.name || ''
      this.form.discoverer = this.user.name || ''
      this.form.discoverDate = dateOnly()
      this.form.solver = this.user.name || ''
      this.form.improveDate = dateOnly()
      this.form.developmentDate = dateOnly()
      this.form.oplDate = dateOnly()
      this.form.trainingDate = dateOnly()
      this.form.lecturer = this.user.name || ''
      this.form.solvingUnit = this.user.section || ''
      if (['six', 'opl'].includes(this.type)) {
        try { this.form.sourceNo = await reserveProposalNumber(this.type) } catch (error) { this.form.sourceNo = nextProposalNo(this.type) }
      }
    }

    const cached = uni.getStorageSync(this.draftKey)
    if (cached && typeof cached === 'object') {
      const restored = { ...this.form, ...cached }
      // 旧版本草稿没有 oplSteps，保留其课程文字与图片供兼容转换。
      if (this.type === 'opl' && !Object.prototype.hasOwnProperty.call(cached, 'oplSteps')) delete restored.oplSteps
      this.form = this.normalizedForm(restored)
      this.draftSavedAt = cached._savedAt || '已恢复'
      uni.showToast({ title: '已恢复本地草稿', icon: 'none' })
    }
    if (['six', 'opl'].includes(this.type) && !this.form.sourceNo) this.form.sourceNo = nextProposalNo(this.type)
    this.initialized = true
  },
  onUnload() {
    clearTimeout(this.draftTimer)
  },
  methods: {
    normalizedForm(source) {
      const next = { ...createEmptyForm(), ...source }
      next.categories = Array.isArray(source.categories) ? [...source.categories] : []
      next.beforePhotos = Array.isArray(source.beforePhotos) ? [...source.beforePhotos] : []
      next.afterPhotos = Array.isArray(source.afterPhotos) ? [...source.afterPhotos] : []
      if (this.type === 'opl' || source.type === 'opl') {
        const steps = Array.isArray(source.oplSteps)
          ? source.oplSteps.map(item => ({ photo: String(item?.photo || item?.photos?.[0] || ''), text: String(item?.text || item?.description || '') }))
          : proposalOplSteps(source)
        next.oplSteps = steps.length ? steps.map(item => createOplStep(item.photo, item.text)) : [createOplStep()]
      }
      delete next._savedAt
      return next
    },
    setOplStepPhoto(index, photos) {
      if (!this.form.oplSteps[index]) return
      this.form.oplSteps[index].photo = Array.isArray(photos) ? (photos[0] || '') : ''
    },
    addOplStep() {
      this.form.oplSteps.push(createOplStep())
    },
    removeOplStep(index) {
      const remove = () => {
        if (this.form.oplSteps.length === 1) this.form.oplSteps.splice(0, 1, createOplStep())
        else this.form.oplSteps.splice(index, 1)
      }
      const step = this.form.oplSteps[index]
      if (!step || (!step.photo && !step.text)) {
        remove()
        return
      }
      uni.showModal({
        title: `删除步骤 ${index + 1}`,
        content: '该步骤的图片和说明将从当前提案中移除。',
        confirmText: '删除',
        confirmColor: '#aa3424',
        success: result => { if (result.confirm) remove() }
      })
    },
    toggleCategory(name) {
      const index = this.form.categories.indexOf(name)
      if (index >= 0) this.form.categories.splice(index, 1)
      else this.form.categories.push(name)
    },
    setPickerValue(key, range, event) {
      const value = range[Number(event.detail.value)]
      if (value) this.form[key] = value
    },
    setDate(key, event) {
      this.form[key] = event.detail.value
    },
    persistDraft(showToast) {
      if (!this.draftKey) return
      const now = new Date()
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      uni.setStorageSync(this.draftKey, { ...this.form, _savedAt: time })
      this.draftSavedAt = time
      if (showToast) uni.showToast({ title: '草稿已保存', icon: 'success' })
    },
    saveDraftManually() {
      clearTimeout(this.draftTimer)
      this.persistDraft(true)
    },
    validate() {
      const authorLabel = this.type === 'tool' ? '请填写开发人员' : this.type === 'opl' ? '请填写编者' : '请填写第一作者'
      const required = [
        ['title', this.type === 'tool' ? '请填写工具名称' : this.type === 'opl' ? '请填写 OPL 名称' : '请填写提案名称'],
        ['team', '请选择所属班组'],
        ['firstAuthor', authorLabel]
      ]
      if (this.type === 'lean') {
        required.push(
          ['projectType', '请选择项目类型'],
          ['beforeText', '请填写改善前说明'],
          ['afterText', '请填写改善后说明']
        )
      } else if (this.type === 'six') {
        if (!this.form.categories.length) return '请至少选择一个六源分类'
        required.push(
          ['discoverer', '请填写发现人'],
          ['discoverDate', '请选择发现日期'],
          ['problem', '请填写问题描述'],
          ['measures', '请填写改善措施'],
          ['solvingUnit', '请选择解决单位'],
          ['solver', '请填写解决人'],
          ['improveDate', '请选择改善日期']
        )
      } else if (this.type === 'tool') {
        required.push(
          ['toolCategory', '请选择工具类别'],
          ['developmentDate', '请选择开发日期'],
          ['usageScope', '请填写使用范围'],
          ['designIdea', '请填写设计思路说明'],
          ['applicationEffect', '请填写运用效果说明']
        )
      } else {
        required.push(
          ['oplDate', '请选择编制日期'],
          ['position', '请填写岗位'],
          ['oplCategory', '请选择 OPL 类别'],
          ['lecturer', '请填写讲师'],
          ['trainingDate', '请选择培训日期'],
          ['trainees', '请填写受训人员'],
          ['trainingEvaluation', '请选择培训总体评价']
        )
      }
      const missing = required.find(([key]) => !String(this.form[key] || '').trim())
      if (missing) return missing[1]
      if (this.type === 'opl') {
        if (this.form.oplCategory === '其他' && !String(this.form.otherCategory || '').trim()) return '请填写其他类别'
        if (!Array.isArray(this.form.oplSteps) || !this.form.oplSteps.length) return '请至少添加一个课程步骤'
        const incompleteStep = this.form.oplSteps.findIndex(step => !step.photo || !String(step.text || '').trim())
        if (incompleteStep >= 0) return `请完善步骤 ${incompleteStep + 1} 的图片和说明`
      } else {
        if (!this.form.beforePhotos.length) return this.type === 'tool' ? '请上传至少一张开发或设计照片' : '请上传至少一张改善前照片'
        if (!this.form.afterPhotos.length) return this.type === 'tool' ? '请上传至少一张成品或应用照片' : '请上传至少一张改善后照片'
      }
      if (this.isImprovementType) {
        const amount = String(this.form.savedAmount || '0').trim()
        if (!/^\d+(\.\d{1,2})?$/.test(amount)) return '节省金额应为非负数字，最多保留两位小数'
      }
      return ''
    },
    confirmSubmit() {
      const message = this.validate()
      if (message) {
        uni.showToast({ title: message, icon: 'none', duration: 2200 })
        return
      }
      uni.showModal({
        title: this.isEditing ? '确认重新提交' : '确认提交审核',
        content: `${this.typeLabel}提交后不可切换类型，确认填写内容已经核对？`,
        confirmText: this.isEditing ? '重新提交' : '确认提交',
        success: result => {
          if (result.confirm) this.submit()
        }
      })
    },
    async submit() {
      this.submitting = true
      clearTimeout(this.draftTimer)
      const now = formatNow()
      let sourceNo = this.type === 'lean' ? '' : this.form.sourceNo
      let id = this.editingProposal ? this.editingProposal.id : ''
      // 六源和 OPL 在打开表单时已预留编号，提交时直接使用页面所示编号，避免重复取号。
      if (!id && sourceNo) id = sourceNo
      if (!id) {
        // 正式编号必须由服务端分配，断网时保留草稿。
        try {
          const number = await reserveProposalNumber(this.type)
          if (this.type !== 'lean') sourceNo = number
          id = number
        } catch (error) {
          this.submitting = false
          this.persistDraft(false)
          uni.showToast({ title: '无法连接服务器，草稿已保留，请稍后重试', icon: 'none' })
          return
        }
      }
      const selectedTeam = this.teams.find(item => item.name === this.form.team)
      const oplSteps = this.type === 'opl'
        ? this.form.oplSteps.map(step => ({ photo: step.photo, text: String(step.text || '').trim() }))
        : []
      const oplContentText = oplSteps.map((step, index) => `步骤 ${index + 1}：${step.text}`).join('\n')
      const proposal = {
        ...(this.editingProposal || {}),
        ...this.form,
        ...(this.type === 'opl' ? {
          oplSteps,
          beforePhotos: oplSteps.map(step => step.photo),
          afterPhotos: [],
          contentText: oplContentText
        } : {}),
        id,
        sourceNo,
        type: this.type,
        typeText: proposalTypeLabel(this.type),
        departmentId: departmentId(this.editingProposal || this.user),
        department: departmentName(this.editingProposal || this.user),
        teamId: this.editingProposal?.teamId || selectedTeam?.id || '',
        section: selectedTeam ? selectedTeam.section : (this.user.section || ''),
        submitterId: this.editingProposal ? (this.editingProposal.submitterId || this.user.workNo) : this.user.workNo,
        submitterName: this.editingProposal ? (this.editingProposal.submitterName || this.user.name) : this.user.name,
        beforeText: this.type === 'six' ? this.form.problem : this.type === 'tool' ? this.form.designIdea : this.type === 'opl' ? oplContentText : this.form.beforeText,
        afterText: this.type === 'six' ? this.form.measures : this.type === 'tool' ? this.form.applicationEffect : this.type === 'opl' ? this.form.trainingEvaluation : this.form.afterText,
        savedAmount: String(this.form.savedAmount || '0'),
        status: 'pending_team',
        statusText: '班组长审核',
        stars: 0,
        points: 0,
        reviewer: '',
        reviewComment: '',
        rejectReason: '',
        firstSubmittedAt: this.editingProposal
          ? (this.editingProposal.firstSubmittedAt || this.editingProposal.submittedAt)
          : now,
        submittedAt: now,
        resubmitCount: this.editingProposal ? Number(this.editingProposal.resubmitCount || 0) + 1 : 0,
        mock: false
      }
      try {
        await saveProposalConfirmed(proposal)
      } catch (error) {
        this.submitting = false
        this.persistDraft(false)
        uni.showToast({ title: error.message || '提交失败，草稿已保留', icon: 'none' })
        return
      }
      this.initialized = false
      uni.removeStorageSync(this.draftKey)
      uni.showToast({ title: this.isEditing ? '已重新提交' : '提交成功', icon: 'success' })
      setTimeout(() => uni.reLaunch({ url: '/pages/proposal/list' }), 700)
    }
  }
}
</script>

<style scoped>
.form-page { padding-bottom: calc(150rpx + env(safe-area-inset-bottom)); }
.form-context { margin-bottom: 20rpx; }
.type-lock { display: flex; min-height: 92rpx; align-items: center; gap: 16rpx; padding: 16rpx 20rpx; border: 1rpx solid #d8d7d1; border-radius: 18rpx; background: #ebeae5; }
.type-lock__icon { display: flex; width: 56rpx; height: 56rpx; flex: 0 0 auto; align-items: center; justify-content: center; border-radius: 15rpx; background: #b93c28; }
.type-lock__copy { min-width: 0; flex: 1; }
.type-lock__label { display: block; color: #293037; font-size: 26rpx; font-weight: 750; }
.type-lock__hint { display: block; margin-top: 3rpx; color: #747a7e; font-size: 21rpx; }
.draft-state { display: flex; align-items: center; gap: 10rpx; padding: 14rpx 6rpx 0; color: #797f83; font-size: 21rpx; }
.draft-state__signal { width: 12rpx; height: 12rpx; border-radius: 50%; background: #b9b7af; }
.draft-state__signal--saved { background: #357459; }
.reject-notice { margin-bottom: 20rpx; padding: 22rpx 24rpx; border: 1rpx solid #e1aaa0; border-radius: 20rpx; background: #fff4f1; }
.reject-notice__heading { display: flex; align-items: center; gap: 10rpx; color: #9f3021; font-size: 25rpx; font-weight: 750; }
.reject-notice__reason { display: block; margin-top: 12rpx; color: #4c4442; font-size: 24rpx; line-height: 1.6; }
.reject-notice__number { display: block; margin-top: 10rpx; color: #8d554b; font-size: 21rpx; font-weight: 600; }
.form-section { margin-top: 20rpx; padding: 26rpx 24rpx 6rpx; }
.form-section__heading { display: flex; align-items: center; justify-content: space-between; gap: 18rpx; margin-bottom: 26rpx; }
.form-section__index { margin-right: 12rpx; color: #b93c28; font-size: 21rpx; font-weight: 800; font-variant-numeric: tabular-nums; }
.form-section__title { color: #242a30; font-size: 30rpx; font-weight: 750; }
.form-section__hint { color: #81868a; font-size: 21rpx; }
.number-field { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 6rpx 18rpx; margin-bottom: 24rpx; padding: 18rpx 20rpx; border-radius: 16rpx; background: #edebe5; }
.number-field__label { color: #6e7478; font-size: 21rpx; font-weight: 600; }
.number-field__value { color: #293038; font-size: 25rpx; font-weight: 750; text-align: right; }
.number-field__note { grid-column: 1 / -1; color: #8a8e91; font-size: 19rpx; text-align: right; }
.category-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12rpx; }
.category-option { position: relative; display: flex; min-height: 128rpx; flex-direction: column; align-items: center; justify-content: center; gap: 8rpx; padding: 14rpx 8rpx; border: 1rpx solid #dcdbd5; border-radius: 16rpx; background: #f9f8f4; color: #555c61; }
.category-option--active { border-color: #c86a59; background: #fff5f1; color: #8f3022; }
.category-option > .app-icon { position: absolute; top: 8rpx; right: 8rpx; }
.category-option__icon { display: flex; width: 54rpx; height: 54rpx; align-items: center; justify-content: center; border-radius: 14rpx; }
.category-option__name { font-size: 21rpx; font-weight: 650; text-align: center; }
.field-row { align-items: start; }
.field-footer { display: flex; justify-content: space-between; gap: 16rpx; margin-top: 8rpx; color: #8a8e91; font-size: 20rpx; line-height: 1.4; }
.other-category { margin-top: 14rpx; }
.evaluation-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12rpx; }
.optional-label { margin-left: auto; color: #8a8f92; font-size: 20rpx; font-weight: 500; }
.photo-divider { position: relative; display: flex; align-items: center; justify-content: center; margin: 5rpx 0 24rpx; color: #8a8f92; font-size: 20rpx; }
.photo-divider::before, .photo-divider::after { height: 1rpx; flex: 1; background: #e2e1dc; content: ''; }
.photo-divider text { padding: 0 16rpx; }
.amount-section { padding-bottom: 8rpx; }
.amount-control { display: flex; min-height: 92rpx; align-items: center; gap: 14rpx; padding: 0 22rpx; border: 1rpx solid #d6d5cf; border-radius: 16rpx; background: #fdfcf9; }
.amount-control__currency { color: #9f3021; font-size: 34rpx; font-weight: 750; }
.amount-control input { min-width: 0; height: 88rpx; flex: 1; color: #20262d; font-size: 32rpx; font-variant-numeric: tabular-nums; }
.amount-control__unit { color: #777d81; font-size: 23rpx; }
.opl-step-editor { overflow: hidden; border: 1rpx solid #deddd7; border-radius: 18rpx; }
.opl-step-edit { padding: 22rpx 20rpx 2rpx; background: #fbfaf7; }
.opl-step-edit + .opl-step-edit { border-top: 1rpx solid #deddd7; }
.opl-step-edit__head { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; margin-bottom: 20rpx; }
.opl-step-edit__head > view { min-width: 0; }
.opl-step-edit__head > view > text:last-child { display: block; margin-top: 4rpx; color: #81868a; font-size: 19rpx; }
.opl-step-edit__number { display: block; color: #67517d; font-size: 24rpx; font-weight: 750; }
.opl-step-edit__remove { display: flex; min-width: 112rpx; min-height: 66rpx; flex: 0 0 auto; align-items: center; justify-content: center; gap: 5rpx; border: 1rpx solid #dfc1bb; border-radius: 13rpx; background: #fff5f2; color: #9a392a; font-size: 20rpx; font-weight: 650; }
.opl-step-edit__description { margin-top: 4rpx; }
.opl-step-add { display: flex; min-height: 82rpx; align-items: center; justify-content: center; gap: 8rpx; margin: 18rpx 0 20rpx; border: 1rpx dashed #b8b6af; border-radius: 15rpx; background: #f5f4ef; color: #4f575c; font-size: 24rpx; font-weight: 700; }
.sticky-actions .btn--secondary { flex: 0 0 210rpx; }
.sticky-actions .submit-button { flex: 1; }
@media (max-width: 350px) {
  .two-column { grid-template-columns: 1fr; }
  .category-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .sticky-actions .btn--secondary { flex-basis: 180rpx; }
}
</style>
