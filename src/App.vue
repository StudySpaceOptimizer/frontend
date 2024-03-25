<script setup lang="ts">
import { RouterView } from 'vue-router'
import TheFooter from '@/components/TheFooter.vue'
import TheNavbar from '@/components/TheNavbar.vue'
import SignInModal from './components/SignInModal.vue'
import SignUpModal from './components/SignUpModal.vue'
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
