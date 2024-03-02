<script setup lang="ts">
import { RouterView } from 'vue-router'
import TheFooter from '@/components/TheFooter.vue'
import TheNavbar from '@/components/TheNavbar.vue'
import SignInModal from './components/SignInModal.vue'
import SignUpModal from './components/SignUpModal.vue'

// Provide the api services
import * as api from './api'
import { provide } from 'vue'

provide(api.API_SERVICE.USER, api.MockUser)
provide(api.API_SERVICE.SEAT, api.PouchDbSeat)
provide(api.API_SERVICE.RESERVE, api.PouchDbReserve)
</script>

<template>
  <TheNavbar />
  <main>
    <RouterView />
  </main>
  <TheFooter />

  <!-- Dialog -->
  <SignInModal />
  <SignUpModal />
</template>

<style scoped lang="scss">
main {
  display: flex;
  flex-direction: column;
  padding: 16px 48px;
  align-items: center;
}
</style>
