<template>
  <view class="field-group">
    <view class="field-label">
      <text>{{ label }}</text><text v-if="required" class="field-required">*</text>
      <text class="photo-count">{{ countText }}</text>
    </view>
    <view class="photo-grid">
      <view v-for="(photo, index) in modelValue" :key="`${photo}-${index}`" class="photo-item" @tap="preview(index)">
        <image :src="photo" mode="aspectFill" />
        <view class="photo-actions">
          <button aria-label="重拍" @tap.stop="retake(index)"><AppIcon name="refresh" :size="30" /></button>
          <button aria-label="删除" @tap.stop="remove(index)"><AppIcon name="trash" :size="30" /></button>
        </view>
      </view>
      <button v-if="canAdd" class="photo-add" @tap="pick">
        <AppIcon name="camera" :size="44" tone="soft" />
        <text>拍摄或上传</text>
      </button>
    </view>
    <text class="field-hint">支持预览、删除和重拍；大图会优先压缩，单张最大支持 20MB。</text>
  </view>
</template>

<script>
import AppIcon from './AppIcon.vue'
import { uploadAsset } from '../utils/api.js'

const COMPRESS_TARGET = 5 * 1024 * 1024
const UPLOAD_LIMIT = 20 * 1024 * 1024

export default {
  name: 'PhotoUploader',
  components: { AppIcon },
  props: {
    modelValue: { type: Array, default: () => [] },
    label: { type: String, default: '现场照片' },
    required: { type: Boolean, default: false },
    max: { type: Number, default: 3 },
    unlimited: { type: Boolean, default: false }
  },
  emits: ['update:modelValue'],
  computed: {
    canAdd() {
      return this.unlimited || this.modelValue.length < this.max
    },
    countText() {
      return this.unlimited ? `已上传 ${this.modelValue.length} 张` : `${this.modelValue.length}/${this.max}`
    }
  },
  methods: {
    preview(index) {
      uni.previewImage({ current: this.modelValue[index], urls: this.modelValue })
    },
    remove(index) {
      const next = this.modelValue.slice()
      next.splice(index, 1)
      this.$emit('update:modelValue', next)
      uni.showToast({ title: '已删除', icon: 'none' })
    },
    async retake(index) {
      const photos = await this.chooseAndCompress(1)
      if (!photos.length) return
      const next = this.modelValue.slice()
      next.splice(index, 1, photos[0])
      this.$emit('update:modelValue', next)
    },
    async pick() {
      const count = this.unlimited ? 9 : Math.min(9, this.max - this.modelValue.length)
      const photos = await this.chooseAndCompress(count)
      if (photos.length) this.$emit('update:modelValue', [...this.modelValue, ...photos])
    },
    chooseAndCompress(count) {
      return new Promise(resolve => {
        uni.chooseImage({
          count,
          sizeType: ['original', 'compressed'],
          sourceType: ['album', 'camera'],
          success: async result => {
            uni.showLoading({ title: '处理图片' })
            const paths = []
            for (const file of result.tempFiles || []) {
              const path = await this.compressToLimit(file.path, file.size || 0)
              if (path) paths.push(path)
            }
            uni.hideLoading()
            resolve(paths)
          },
          fail: () => resolve([])
        })
      })
    },
    async compressToLimit(path, initialSize) {
      let uploadPath = path
      if (!initialSize || initialSize <= COMPRESS_TARGET) return this.uploadPhoto(uploadPath)
      let currentPath = path
      let currentSize = initialSize
      for (const quality of [82, 68, 54, 42]) {
        currentPath = await new Promise(resolve => {
          uni.compressImage({ src: currentPath, quality, success: res => resolve(res.tempFilePath), fail: () => resolve(currentPath) })
        })
        const size = await this.getFileSize(currentPath)
        if (size) currentSize = size
        if (size && size <= COMPRESS_TARGET) return this.uploadPhoto(currentPath)
      }
      if (currentSize <= UPLOAD_LIMIT) return this.uploadPhoto(currentPath)
      uni.showToast({ title: '单张图片不能超过 20MB', icon: 'none', duration: 2200 })
      return ''
    },
    async uploadPhoto(path) {
      try {
        const file = await uploadAsset(path, { kind: 'photo' })
        return file.url
      } catch (error) {
        uni.showToast({ title: error.message || '照片上传失败', icon: 'none', duration: 2400 })
        return ''
      }
    },
    getFileSize(path) {
      return new Promise(resolve => {
        uni.getFileInfo({ filePath: path, success: res => resolve(res.size || 0), fail: () => resolve(0) })
      })
    }
  }
}
</script>

<style scoped>
.field-label { justify-content: flex-start; }
.photo-count { margin-left: auto; color: #8a8f92; font-size: 21rpx; font-weight: 500; }
.photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14rpx; }
.photo-item, .photo-add { position: relative; overflow: hidden; aspect-ratio: 1; border-radius: 16rpx; }
.photo-item { background: #e8e7e1; }
.photo-item > image { width: 100%; height: 100%; }
.photo-actions { position: absolute; right: 8rpx; bottom: 8rpx; display: flex; gap: 6rpx; }
.photo-actions button { display: flex; width: 52rpx; height: 52rpx; align-items: center; justify-content: center; border-radius: 50%; background: rgba(251,250,247,.94); }
.photo-add { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10rpx; border: 2rpx dashed #c5c4bd; background: #f8f7f3; color: #6f7579; font-size: 22rpx; }
</style>
