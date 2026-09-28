<template>
  <view class="page-shell">
    <AppHeader title="新建提案" subtitle="第 1 步，共 2 步" :back="true" />

    <view class="page-body type-page">
      <view class="intro-block">
        <text class="eyebrow">选择申报路径</text>
        <text class="intro-title">这次改善属于哪一类？</text>
        <text class="intro-copy">四类成果采用各自的编号与填写字段，提交后先由班组长评审，再由评审小组终审。</text>
      </view>

      <view class="type-stack" role="radiogroup" aria-label="提案类型">
        <button
          v-for="item in types"
          :key="item.value"
          class="type-option"
          :class="{ 'type-option--active': selected === item.value }"
          :aria-checked="selected === item.value"
          role="radio"
          @tap="selected = item.value"
        >
          <view class="type-option__top">
            <view class="type-option__icon" :class="`type-option__icon--${item.value}`">
              <AppIcon :name="item.icon" :size="48" :tone="selected === item.value ? 'inverse' : 'soft'" />
            </view>
            <view class="type-option__copy">
              <view class="type-option__heading">
                <text class="type-option__title">{{ item.title }}</text>
                <text class="type-option__badge">{{ item.badge }}</text>
              </view>
              <text class="type-option__desc">{{ item.description }}</text>
            </view>
            <view class="radio-mark">
              <view v-if="selected === item.value" class="radio-mark__dot" />
            </view>
          </view>
          <view class="type-option__meta">
            <view v-for="point in item.points" :key="point" class="meta-item">
              <AppIcon name="check" :size="28" tone="accent" />
              <text>{{ point }}</text>
            </view>
          </view>
        </button>
      </view>

      <view class="lock-notice">
        <AppIcon name="shield-lock" :size="36" tone="soft" />
        <view>
          <text class="lock-notice__title">提交后不可切换类型</text>
          <text class="lock-notice__copy">被驳回时可补充或修改内容，系统会保留原编号与提案类型。</text>
        </view>
      </view>
    </view>

    <view class="sticky-actions">
      <button class="btn btn--primary btn--block" :disabled="!selected" @tap="continueToForm">
        <text>填写{{ selectedLabel || '提案' }}</text>
        <AppIcon name="chevron-right" :size="34" tone="inverse" />
      </button>
    </view>
  </view>
</template>

<script>
import AppHeader from '../../components/AppHeader.vue'
import AppIcon from '../../components/AppIcon.vue'
import { PROPOSAL_TYPES } from '../../utils/proposal-types.js'

export default {
  components: { AppHeader, AppIcon },
  data() {
    return {
      selected: '',
      types: PROPOSAL_TYPES.map(item => ({ ...item, title: item.label }))
    }
  },
  computed: {
    selectedLabel() {
      const item = this.types.find(type => type.value === this.selected)
      return item ? item.title : ''
    }
  },
  methods: {
    continueToForm() {
      if (!this.selected) return
      uni.showModal({
        title: `确认选择${this.selectedLabel}`,
        content: '正式提交后提案类型不可修改，请确认申报路径。',
        confirmText: '确认填写',
        success: result => {
          if (result.confirm) uni.navigateTo({ url: `/pages/proposal/form?type=${this.selected}` })
        }
      })
    }
  }
}
</script>

<style scoped>
.type-page { padding-bottom: calc(150rpx + env(safe-area-inset-bottom)); }
.intro-block { padding: 18rpx 4rpx 30rpx; }
.eyebrow { display: block; color: #a43625; font-size: 22rpx; font-weight: 750; letter-spacing: 2rpx; }
.intro-title { display: block; margin-top: 10rpx; color: #20262d; font-size: 42rpx; font-weight: 780; line-height: 1.22; }
.intro-copy { display: block; max-width: 66ch; margin-top: 14rpx; color: #6f767b; font-size: 25rpx; line-height: 1.65; }
.type-stack { display: flex; flex-direction: column; gap: 18rpx; }
.type-option { width: 100%; overflow: hidden; padding: 26rpx; border: 2rpx solid #d9d8d2; border-radius: 24rpx; background: #fbfaf7; text-align: left; transition: border-color 180ms ease-out, background 180ms ease-out, transform 180ms ease-out; }
.type-option:active { transform: scale(.992); }
.type-option--active { border-color: #b93c28; background: #fff9f6; box-shadow: 0 10rpx 30rpx rgba(82, 53, 40, .08); }
.type-option__top { display: flex; align-items: flex-start; gap: 20rpx; }
.type-option__icon { display: flex; width: 76rpx; height: 76rpx; flex: 0 0 auto; align-items: center; justify-content: center; border-radius: 20rpx; background: #ebeae5; }
.type-option__icon--lean { background: #eee8da; }
.type-option__icon--six { background: #e2ece7; }
.type-option__icon--tool { background: #e8e6f0; }
.type-option__icon--opl { background: #e8edf0; }
.type-option--active .type-option__icon { background: #b93c28; }
.type-option__copy { min-width: 0; flex: 1; }
.type-option__heading { display: flex; flex-wrap: wrap; align-items: center; gap: 10rpx; }
.type-option__title { color: #252b31; font-size: 32rpx; font-weight: 760; }
.type-option__badge { padding: 5rpx 12rpx; border-radius: 999rpx; background: #ebeae5; color: #686e72; font-size: 19rpx; font-weight: 650; }
.type-option--active .type-option__badge { background: #f3dfd9; color: #983020; }
.type-option__desc { display: block; margin-top: 9rpx; color: #6c7378; font-size: 24rpx; line-height: 1.55; }
.radio-mark { display: flex; width: 38rpx; height: 38rpx; flex: 0 0 auto; align-items: center; justify-content: center; border: 2rpx solid #bdbdb7; border-radius: 50%; }
.type-option--active .radio-mark { border-color: #b93c28; }
.radio-mark__dot { width: 20rpx; height: 20rpx; border-radius: 50%; background: #b93c28; }
.type-option__meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10rpx 16rpx; margin-top: 22rpx; padding-top: 20rpx; border-top: 1rpx solid #e4e3de; }
.meta-item { display: flex; align-items: center; gap: 8rpx; color: #5d6469; font-size: 22rpx; }
.lock-notice { display: flex; align-items: flex-start; gap: 16rpx; margin-top: 26rpx; padding: 22rpx 24rpx; border: 1rpx solid #deddd7; border-radius: 18rpx; background: #ebeae5; }
.lock-notice__title { display: block; color: #30373d; font-size: 24rpx; font-weight: 700; }
.lock-notice__copy { display: block; margin-top: 5rpx; color: #6e7579; font-size: 22rpx; line-height: 1.5; }
@media (max-width: 350px) {
  .type-option__meta { grid-template-columns: 1fr; }
}
</style>
