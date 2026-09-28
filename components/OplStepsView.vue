<template>
  <view class="opl-steps">
    <view v-for="(step, index) in steps" :key="`${step.photo || 'step'}-${index}`" class="opl-step">
      <view class="opl-step__head">
        <text class="opl-step__number">步骤 {{ index + 1 }}</text>
        <text>一图一说明</text>
      </view>
      <button v-if="step.photo" class="opl-step__photo" @tap="preview(step.photo)">
        <image :src="step.photo" mode="aspectFill" />
        <view class="opl-step__zoom"><AppIcon name="eye" :size="27" tone="inverse" /></view>
      </button>
      <view v-else class="opl-step__photo opl-step__photo--empty">
        <AppIcon name="photo" :size="44" tone="muted" />
        <text>原记录未上传本步骤图片</text>
      </view>
      <view class="opl-step__copy">
        <text class="opl-step__label">步骤说明</text>
        <text class="opl-step__text">{{ step.text || '原记录未填写本步骤说明' }}</text>
      </view>
    </view>
  </view>
</template>

<script>
import AppIcon from './AppIcon.vue'

export default {
  name: 'OplStepsView',
  components: { AppIcon },
  props: {
    steps: { type: Array, default: () => [] }
  },
  methods: {
    preview(photo) {
      const photos = this.steps.map(item => item.photo).filter(Boolean)
      uni.previewImage({ current: photo, urls: photos })
    }
  }
}
</script>

<style scoped>
.opl-steps { overflow: hidden; border: 1rpx solid #deddd7; border-radius: 20rpx; background: #fbfaf7; }
.opl-step { padding: 20rpx; }
.opl-step + .opl-step { border-top: 1rpx solid #deddd7; }
.opl-step__head { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; margin-bottom: 14rpx; color: #858a8e; font-size: 19rpx; }
.opl-step__number { display: inline-flex; min-height: 42rpx; align-items: center; padding: 0 14rpx; border-radius: 999rpx; background: #eee7f4; color: #67517d; font-size: 21rpx; font-weight: 750; }
.opl-step__photo { position: relative; display: block; width: 100%; overflow: hidden; aspect-ratio: 4 / 3; border-radius: 14rpx; background: #e3e2dd; }
.opl-step__photo image { width: 100%; height: 100%; }
.opl-step__photo--empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10rpx; color: #7f8589; font-size: 21rpx; }
.opl-step__zoom { position: absolute; right: 10rpx; bottom: 10rpx; display: flex; width: 46rpx; height: 46rpx; align-items: center; justify-content: center; border-radius: 50%; background: rgba(34, 41, 47, .76); }
.opl-step__copy { padding: 17rpx 4rpx 2rpx; }
.opl-step__label { display: block; color: #8d3a2d; font-size: 20rpx; font-weight: 700; }
.opl-step__text { display: block; margin-top: 7rpx; color: #3d454b; font-size: 24rpx; line-height: 1.7; white-space: pre-wrap; word-break: break-word; }
</style>
