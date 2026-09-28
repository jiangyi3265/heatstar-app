<template>
  <image
    class="app-icon"
    :class="[`app-icon--${tone}`]"
    :style="{ width: normalizedSize, height: normalizedSize }"
    :src="`/static/icons/${name}.svg`"
    mode="aspectFit"
  />
</template>

<script>
export default {
  name: 'AppIcon',
  props: {
    name: { type: String, required: true },
    size: { type: [Number, String], default: 40 },
    tone: { type: String, default: 'default' }
  },
  computed: {
    normalizedSize() {
      return typeof this.size === 'number' ? `${this.size}rpx` : this.size
    }
  }
}
</script>

<style scoped>
.app-icon { display: block; flex: 0 0 auto; }
.app-icon--muted { opacity: .55; }
.app-icon--soft { opacity: .72; }
.app-icon--inverse { filter: brightness(0) invert(1); }
.app-icon--accent { filter: sepia(1) saturate(5) hue-rotate(330deg) brightness(.72); }
</style>
