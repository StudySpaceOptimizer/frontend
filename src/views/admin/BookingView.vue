<script setup lang="ts">
import ListView from '@/components/ListView.vue'
import BookingFilter from '@/components/BookingFilter.vue'
import type { Data } from '@/components/ListViewType'

const data: Data[] = [
  {
    id: 1,
    range: {
      date: '2024-01-01',
      start: '09:00',
      end: '10:00'
    },
    seat: 'A1',
    user: {
      id: 1,
      name: 'user1',
      identity: 'student',
      email: '123@com',
      ban: {
        points: 0,
        banned: '2024-01-15',
        until: '2024-01-18'
      }
    },
    actions: ['刪除預約', '更多資訊']
  }
]
</script>

<template>
  <BookingFilter />
  <ListView :data="data" />
</template>

<style scoped></style>
