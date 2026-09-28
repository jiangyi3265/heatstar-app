<template>
  <view class="tabbar">
    <button v-for="item in items" :key="item.key" class="tabbar-item" :class="{ active: current === item.key }" @tap="go(item)">
      <view class="tabbar-icon"><AppIcon :name="item.icon" :size="42" :tone="current === item.key ? 'accent' : 'muted'" /></view>
      <text>{{ item.label }}</text>
    </button>
  </view>
</template>

<script>
import AppIcon from './AppIcon.vue'

export default {
  name: 'AppTabbar',
  components: { AppIcon },
  props: { current: { type: String, default: 'home' } },
  data() {
    return {
      items: [
        { key: 'home', label: '首页', icon: 'home', url: '/pages/index/index' },
        { key: 'proposal', label: '提案', icon: 'bulb', url: '/pages/proposal/list' },
        { key: 'points', label: '积分', icon: 'trophy', url: '/pages/points/index' },
        { key: 'profile', label: '我的', icon: 'user-circle', url: '/pages/profile/index' }
      ]
    }
  },
  methods: {
    go(item) {
      if (item.key === this.current) return
      uni.reLaunch({ url: item.url })
    }
  }
}
</script>

<style scoped>
.tabbar { position: fixed; z-index: 40; right: 0; bottom: 0; left: 0; display: grid; grid-template-columns: repeat(4, 1fr); padding: 10rpx 20rpx calc(12rpx + env(safe-area-inset-bottom)); border-top: 1rpx solid #d9d8d2; background: rgba(251, 250, 247, .98); }
.tabbar-item { display: flex; min-height: 88rpx; flex-direction: column; align-items: center; justify-content: center; gap: 4rpx; border-radius: 16rpx; color: #7a8084; font-size: 21rpx; font-weight: 600; }
.tabbar-item.active { color: #a93221; }
.tabbar-icon { display: flex; width: 54rpx; height: 48rpx; align-items: center; justify-content: center; }
</style>
