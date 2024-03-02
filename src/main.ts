import './assets/main.css'

import { createApp, provide } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import App from './App.vue'
import router from './router'

import VueKonva from 'vue-konva'

const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(router)
app.use(VueKonva)

app.mount('#app')

// Provide the api services
import * as api from './api'

provide(api.API_SERVICE.USER, api.PouchDbUser)
provide(api.API_SERVICE.SEAT, api.PouchDbSeat)
provide(api.API_SERVICE.RESERVE, api.PouchDbReserve)