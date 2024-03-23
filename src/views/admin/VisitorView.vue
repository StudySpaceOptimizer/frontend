<script setup lang="ts">
import ListView from '@/components/ListView.vue'

const data: any[] = [
  {
    id: 1,
    user: {
      id: 1,
      name: 'user4',
      identity: '校外人士',
      email: '234@com',
      idCard: 'A123456789',
      applyDate: '2024-01-01'
    },
    actions: ['同意', '刪除']
  }
]
</script>

<template>
  <ListView :data="data" />
</template>
