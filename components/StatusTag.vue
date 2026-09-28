<template>
  <text class="status-tag" :class="`status-tag--${tone}`">{{ label }}</text>
</template>

<script>
export default {
  name: 'StatusTag',
  props: {
    label: { type: String, required: true },
    status: { type: String, default: '' }
  },
  computed: {
    tone() {
      if (['approved', 'published', 'eligible'].includes(this.status)) return 'success'
      if (['rejected', 'blocked', 'ineligible'].includes(this.status)) return 'danger'
      if (String(this.status).startsWith('pending')) return 'warning'
      return 'neutral'
    }
  }
}
</script>

<style scoped>
.status-tag { display: inline-flex; min-height: 46rpx; align-items: center; padding: 0 16rpx; border-radius: 999rpx; font-size: 21rpx; font-weight: 700; white-space: nowrap; }
.status-tag--success { background: #e5f1ea; color: #276348; }
.status-tag--warning { background: #f7ecd9; color: #8a5a19; }
.status-tag--danger { background: #f8e2de; color: #9f2f20; }
.status-tag--neutral { background: #eae9e4; color: #60666b; }
</style>
