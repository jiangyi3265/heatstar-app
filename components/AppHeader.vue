<template>
  <view class="header-wrap">
    <view :style="{ height: `${statusBarHeight}px` }" />
    <view class="header-bar">
      <button v-if="back" class="header-button" aria-label="返回" @tap="goBack">
        <AppIcon name="arrow-left" :size="42" />
      </button>
      <view v-else class="brand-mark" aria-label="热创星">
        <text class="brand-mark__heat">热</text>
      </view>
      <view class="header-copy">
        <text class="header-title">{{ title }}</text>
        <text v-if="subtitle" class="header-subtitle">{{ subtitle }}</text>
      </view>
      <button v-if="actionIcon" class="header-button" :aria-label="actionLabel" @tap="$emit('action')">
        <AppIcon :name="actionIcon" :size="40" />
        <text v-if="badge" class="header-badge">{{ badge }}</text>
      </button>
      <view v-else class="header-spacer" />
    </view>
  </view>
</template>

<script>
import AppIcon from './AppIcon.vue'

export default {
  name: 'AppHeader',
  components: { AppIcon },
  props: {
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    back: { type: Boolean, default: false },
    actionIcon: { type: String, default: '' },
    actionLabel: { type: String, default: '' },
    badge: { type: [String, Number], default: '' }
  },
  emits: ['action'],
  data() {
    return { statusBarHeight: 24 }
  },
  created() {
    try {
      const info = uni.getSystemInfoSync()
      this.statusBarHeight = info.statusBarHeight || 24
    } catch (error) {}
  },
  methods: {
    goBack() {
      const pages = getCurrentPages()
      if (pages.length > 1) uni.navigateBack()
      else uni.reLaunch({ url: '/pages/index/index' })
    }
  }
}
</script>

<style scoped>
.header-wrap { position: relative; z-index: 30; border-bottom: 1rpx solid #deddd7; background: #fbfaf7; }
.header-bar { display: grid; min-height: 104rpx; grid-template-columns: 76rpx 1fr 76rpx; align-items: center; padding: 0 24rpx; }
.header-button { position: relative; display: flex; width: 76rpx; height: 76rpx; align-items: center; justify-content: center; border-radius: 50%; }
.header-button:active { background: #ecebe6; }
.header-spacer { width: 76rpx; }
.header-copy { min-width: 0; text-align: center; }
.header-title { display: block; overflow: hidden; color: #20262d; font-size: 32rpx; font-weight: 750; line-height: 1.2; text-overflow: ellipsis; white-space: nowrap; }
.header-subtitle { display: block; margin-top: 5rpx; overflow: hidden; color: #777d81; font-size: 21rpx; text-overflow: ellipsis; white-space: nowrap; }
.brand-mark { display: flex; width: 62rpx; height: 62rpx; align-items: center; justify-content: center; border-radius: 18rpx 18rpx 18rpx 6rpx; background: #b93c28; }
.brand-mark__heat { color: #fffaf4; font-size: 32rpx; font-weight: 800; }
.header-badge { position: absolute; top: 6rpx; right: 5rpx; display: flex; min-width: 30rpx; height: 30rpx; align-items: center; justify-content: center; padding: 0 7rpx; border: 3rpx solid #fbfaf7; border-radius: 999rpx; background: #b93c28; color: #fff; font-size: 18rpx; font-weight: 700; }
</style>
