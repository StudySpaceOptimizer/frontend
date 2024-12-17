import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import App from './App.vue'
import router from './router'
import * as api from './api'
import DependencyContainer from '@/DependencyContainer'

import VueKonva from 'vue-konva'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import i18n from './i18n'

const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// Dependency Injection
const container = DependencyContainer.getInstance()
container.register(api.API_SERVICE.USER, api.LaravelUser)
container.register(api.API_SERVICE.SEAT, api.LaravelSeat)
container.register(api.API_SERVICE.RESERVE, api.LaravelReserve)

app.use(i18n)
app.use(pinia)
app.use(router)
app.use(VueKonva)
app.use(ElementPlus)

app.mount('#app')
