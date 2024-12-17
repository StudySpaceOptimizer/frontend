<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAccountStore } from '@/stores/account';
import { onMounted } from 'vue';
import { ElMessage } from 'element-plus';

const router = useRouter()
const userStore = useAccountStore()

onMounted(() => {
  const code = router.currentRoute.value.query.code
  const code_str = code?.toString()

  if (!code_str) {
    ElMessage.error('授權失敗，請重新嘗試')
    return
  }

  userStore.oAuthCallback(code_str)
  router.push({ name: 'home' })
})
</script>

<template>
  處理 OAuth 授權...
</template>

<style scoped></style>