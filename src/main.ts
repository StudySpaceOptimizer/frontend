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

const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// Dependency Injection
const container = DependencyContainer.getInstance()
container.register(api.API_SERVICE.USER, api.SupabaseUser)
container.register(api.API_SERVICE.SEAT, api.SupabaseSeat)
container.register(api.API_SERVICE.RESERVE, api.MockReserve)

app.use(pinia)
app.use(router)
app.use(VueKonva)
app.use(ElementPlus)

app.mount('#app')
