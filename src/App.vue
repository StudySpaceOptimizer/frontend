<script setup lang="ts">
import { computed } from 'vue'
import { RouterView } from 'vue-router'
import zhTw from 'element-plus/es/locale/lang/zh-tw'
import en from 'element-plus/es/locale/lang/en'

import { useLangStore } from '@/stores/lang'
import TheFooter from '@/components/TheFooter.vue'
import TheNavbar from '@/components/TheNavbar.vue'

const langStore = useLangStore()
const language = computed(() => langStore.lang)
const langType = {
  'zh-tw': zhTw,
  en: en
}
</script>

<template>
  <el-config-provider :locale="langType[language]">
    <TheNavbar />
    <main>
      <RouterView />
    </main>
    <TheFooter />
  </el-config-provider>
</template>

<style scoped lang="scss">
main {
  display: flex;
  flex-direction: column;
  padding: 16px 48px;
  align-items: center;
}
</style>
