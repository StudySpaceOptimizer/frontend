<script setup lang="ts">
import { RouterView } from 'vue-router'
import TheFooter from '@/components/TheFooter.vue'
import TheNavbar from '@/components/TheNavbar.vue'
import SignIn from './components/SignIn.vue'
import SignUp from './components/SignUp.vue'
</script>

<template>
  <TheNavbar />
  <main>
    <RouterView />
  </main>
  <TheFooter />

  <!-- Dialog -->
  <SignIn />
  <SignUp />
</template>

<style scoped lang="scss">
main {
  display: flex;
  flex-direction: column;
  padding: 16px 48px;
  align-items: center;
}
</style>
