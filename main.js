import App from './App'

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
	...App
})
app.$mount()
// #endif

// #ifdef VUE3
import {
	createSSRApp
} from 'vue'
import { installAuthGuard } from './utils/guard.js'
export function createApp() {
	const app = createSSRApp(App)
	installAuthGuard(app)
	return {
		app
	}
}
// #endif
