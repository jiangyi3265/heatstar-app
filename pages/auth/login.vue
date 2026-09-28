<template>
  <view class="login-shell">
    <view class="login-panel">
      <view class="brand">
        <view class="brand__mark"><text>热</text></view>
        <view class="brand__copy">
          <text class="brand__name">热创星</text>
          <text class="brand__desc">全员持续改善平台</text>
        </view>
      </view>

      <view v-if="step === 'login'" class="card">
        <text class="card__title">员工登录</text>
        <text class="card__hint">使用工号登录，密码由本人保管</text>

        <view class="field">
          <text class="field__label">工号</text>
          <view class="control" :class="{ 'control--focus': focus === 'workNo' }">
            <AppIcon name="hash" :size="20" tone="muted" />
            <input
              class="control__input"
              type="text"
              placeholder="请输入工号"
              placeholder-class="control__placeholder"
              :value="form.workNo"
              :disabled="loading"
              confirm-type="next"
              @input="form.workNo = $event.detail.value"
              @focus="focus = 'workNo'"
              @blur="focus = ''"
            />
          </view>
        </view>

        <view class="field">
          <text class="field__label">密码</text>
          <view class="control" :class="{ 'control--focus': focus === 'password' }">
            <AppIcon name="shield-lock" :size="20" tone="muted" />
            <input
              class="control__input"
              :password="!showPassword"
              type="text"
              placeholder="请输入密码"
              placeholder-class="control__placeholder"
              :value="form.password"
              :disabled="loading"
              confirm-type="done"
              @input="form.password = $event.detail.value"
              @focus="focus = 'password'"
              @blur="focus = ''"
              @confirm="submit"
            />
            <button class="control__toggle" :aria-label="showPassword ? '隐藏密码' : '显示密码'" @tap="showPassword = !showPassword">
              <AppIcon :name="showPassword ? 'eye-off' : 'eye'" :size="20" tone="muted" />
            </button>
          </view>
        </view>

        <view v-if="error" class="notice notice--error">
          <AppIcon name="alert-triangle" :size="18" />
          <text>{{ error }}</text>
        </view>

        <button class="btn-main" :disabled="loading" @tap="submit">
          <text>{{ loading ? '登录中…' : '登 录' }}</text>
        </button>

        <view class="tip">
          <AppIcon name="info-circle" :size="18" tone="muted" />
          <text class="tip__text">初始密码 {{ defaultPassword }}，首次登录后请及时修改。忘记密码请联系管理员重置。</text>
        </view>
      </view>

      <view v-else class="card">
        <text class="card__title">设置新密码</text>
        <text class="card__hint">{{ user.name }}（工号 {{ user.workNo }}）当前仍在使用初始密码</text>

        <view class="field">
          <text class="field__label">新密码</text>
          <view class="control" :class="{ 'control--focus': focus === 'next' }">
            <AppIcon name="shield-lock" :size="20" tone="muted" />
            <input
              class="control__input"
              :password="!showPassword"
              type="text"
              placeholder="至少 6 位"
              placeholder-class="control__placeholder"
              :value="pw.next"
              :disabled="loading"
              @input="pw.next = $event.detail.value"
              @focus="focus = 'next'"
              @blur="focus = ''"
            />
            <button class="control__toggle" :aria-label="showPassword ? '隐藏密码' : '显示密码'" @tap="showPassword = !showPassword">
              <AppIcon :name="showPassword ? 'eye-off' : 'eye'" :size="20" tone="muted" />
            </button>
          </view>
        </view>

        <view class="field">
          <text class="field__label">确认新密码</text>
          <view class="control" :class="{ 'control--focus': focus === 'confirm' }">
            <AppIcon name="shield-lock" :size="20" tone="muted" />
            <input
              class="control__input"
              :password="!showPassword"
              type="text"
              placeholder="再输入一次"
              placeholder-class="control__placeholder"
              :value="pw.confirm"
              :disabled="loading"
              @input="pw.confirm = $event.detail.value"
              @focus="focus = 'confirm'"
              @blur="focus = ''"
              @confirm="savePassword"
            />
          </view>
        </view>

        <view v-if="error" class="notice notice--error">
          <AppIcon name="alert-triangle" :size="18" />
          <text>{{ error }}</text>
        </view>

        <button class="btn-main" :disabled="loading" @tap="savePassword">
          <text>{{ loading ? '保存中…' : '保存并进入' }}</text>
        </button>
        <button class="btn-plain" :disabled="loading" @tap="enter(user)">暂不修改，先进入</button>
      </view>

      <text class="foot">{{ serverLabel }}</text>
    </view>
  </view>
</template>

<script>
import AppIcon from '../../components/AppIcon.vue'
import { apiBase } from '../../utils/api.js'
import { login, changePassword, currentUser, isLoggedIn, HOME_PAGE } from '../../utils/session.js'

const ADMIN_HOME = '/pages/admin/index'
const LAST_WORK_NO = 'heatstar_last_work_no'

export default {
  components: { AppIcon },
  data() {
    return {
      step: 'login',
      loading: false,
      error: '',
      focus: '',
      showPassword: false,
      defaultPassword: '由管理员分配',
      form: { workNo: '', password: '' },
      pw: { next: '', confirm: '' },
      user: {}
    }
  },
  computed: {
    serverLabel() {
      const base = apiBase()
      return base.startsWith('http://127.0.0.1') || base.startsWith('http://localhost')
        ? '本地调试环境'
        : '企业内部系统'
    }
  },
  onLoad() {
    // 已经登录的直接放行，不用再看一次登录页。
    if (isLoggedIn()) {
      this.enter(currentUser())
      return
    }
    this.form.workNo = uni.getStorageSync(LAST_WORK_NO) || ''
  },
  methods: {
    isAdminHost() {
      // #ifdef H5
      if (typeof window !== 'undefined') {
        return window.location.hostname.toLowerCase().startsWith('gyht.')
      }
      // #endif
      return false
    },
    enter(user) {
      const target = user && user.isAdmin && this.isAdminHost() ? ADMIN_HOME : HOME_PAGE
      uni.reLaunch({ url: target })
    },
    async submit() {
      if (this.loading) return
      const workNo = String(this.form.workNo || '').trim()
      const password = String(this.form.password || '')
      if (!workNo) {
        this.error = '请输入工号'
        return
      }
      if (!password) {
        this.error = '请输入密码'
        return
      }
      this.loading = true
      this.error = ''
      try {
        const user = await login(workNo, password)
        uni.setStorageSync(LAST_WORK_NO, workNo)
        this.user = user
        if (user.mustChangePassword) {
          this.step = 'password'
          this.showPassword = false
        } else {
          this.enter(user)
        }
      } catch (error) {
        this.error = error.message || '登录失败，请稍后再试'
      } finally {
        this.loading = false
      }
    },
    async savePassword() {
      if (this.loading) return
      const next = String(this.pw.next || '').trim()
      const confirm = String(this.pw.confirm || '').trim()
      if (next.length < 6) {
        this.error = '新密码至少 6 位'
        return
      }
      if (next !== confirm) {
        this.error = '两次输入的新密码不一致'
        return
      }
      this.loading = true
      this.error = ''
      try {
        const result = await changePassword(this.form.password, next)
        uni.showToast({ title: '密码已更新', icon: 'success' })
        setTimeout(() => this.enter(result.user || this.user), 500)
      } catch (error) {
        this.error = error.message || '密码修改失败'
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.login-shell {
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  padding: 32px 20px calc(32px + env(safe-area-inset-bottom));
  background: #20262d;
}

.login-panel { width: 100%; max-width: 400px; }

.brand { display: flex; align-items: center; gap: 12px; margin-bottom: 22px; }
.brand__mark { display: flex; width: 46px; height: 46px; flex: 0 0 auto; align-items: center; justify-content: center; border-radius: 14px 14px 14px 4px; background: #b93c28; }
.brand__mark text { color: #fffaf4; font-size: 24px; font-weight: 800; }
.brand__copy { min-width: 0; }
.brand__name { display: block; color: #f8f7f2; font-size: 22px; font-weight: 800; letter-spacing: 1px; }
.brand__desc { display: block; margin-top: 3px; color: rgba(248, 247, 242, .58); font-size: 13px; }

.card { padding: 24px 20px 22px; border: 1px solid #deddd7; border-radius: 16px; background: #fbfaf7; }
.card__title { display: block; color: #20262d; font-size: 19px; font-weight: 750; }
.card__hint { display: block; margin-top: 6px; color: #777d81; font-size: 13px; line-height: 1.5; }

.field { margin-top: 18px; }
.field__label { display: block; margin-bottom: 8px; color: #363c42; font-size: 13px; font-weight: 600; }

.control { display: flex; min-height: 48px; align-items: center; gap: 10px; padding: 0 12px; border: 1px solid #d6d5cf; border-radius: 10px; background: #fdfcf9; transition: border-color 160ms ease-out; }
.control--focus { border-color: #b93c28; }
.control__input { min-width: 0; flex: 1; height: 46px; color: #20262d; font-size: 16px; }
.control__placeholder { color: #a1a4a6; font-size: 15px; }
.control__toggle { display: flex; width: 34px; height: 34px; flex: 0 0 auto; align-items: center; justify-content: center; border-radius: 8px; }
.control__toggle:active { background: #ecebe6; }

.notice { display: flex; align-items: flex-start; gap: 7px; margin-top: 16px; padding: 10px 12px; border-radius: 10px; font-size: 13px; line-height: 1.5; }
.notice--error { border: 1px solid #dba49b; background: #fff5f2; color: #a83222; }

.btn-main { display: flex; min-height: 48px; width: 100%; align-items: center; justify-content: center; margin-top: 22px; border-radius: 10px; background: #b93c28; color: #fffaf4; font-size: 16px; font-weight: 700; letter-spacing: 2px; transition: opacity 160ms ease-out; }
.btn-main:active { opacity: .84; }
.btn-main[disabled] { opacity: .5; }

.btn-plain { display: flex; min-height: 44px; width: 100%; align-items: center; justify-content: center; margin-top: 10px; border-radius: 10px; color: #6a7075; font-size: 14px; font-weight: 600; }
.btn-plain:active { background: #efeee9; }

.tip { display: flex; align-items: flex-start; gap: 7px; margin-top: 18px; padding-top: 16px; border-top: 1px solid #e6e5df; }
.tip__text { flex: 1; color: #82878b; font-size: 12px; line-height: 1.6; }

.foot { display: block; margin-top: 20px; color: rgba(248, 247, 242, .38); font-size: 12px; text-align: center; }
</style>
