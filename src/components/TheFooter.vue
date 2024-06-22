<script setup lang="ts">
import { computed } from 'vue'

const version = import.meta.env.VITE_APP_VERSION || 'unknown'
const type = import.meta.env.VITE_APP_TYPE || 'alpha'
const formattedVersion = computed(() => {
  const now = new Date()
  const year = now.getFullYear().toString().slice(2)
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  return `${year}${month}.${version}.${type}`
})
</script>

<template>
  <footer>
    <div class="wrapper">
      <p>全興書苑 預約系統</p>
      <p>© 2024 全興書苑</p>
      <p>{{ formattedVersion }}</p>
    </div>
  </footer>
</template>

<style scoped>
footer {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 5rem;
  background-color: #222222;
  color: white;
}

.wrapper {
  display: flex;
}

.wrapper p {
  margin: 0 0.5rem;
}
</style>
