<script setup lang="ts">
import BookingFiliter from '@/components/BookingFilter.vue'
import ListView from '@/components/ListView.vue'

import type { Data } from '@/components/ListViewType'

const data: Data[] = [
  {
    id: 1,
    seat: 'A1',
    range: {
      date: '2024-01-01',
      start: '09:00',
      end: '12:00'
    },
    actions: ['刪除預約']
  },
  {
    id: 2,
    seat: 'A1',
    range: {
      date: '2024-01-02',
      start: '09:00',
      end: '12:00'
    },
    actions: ['提前離開'],
  },
  {
    id: 3,
    seat: 'A1',
    range: {  
      date: '2024-01-03',
      start: '09:00',
      end: '12:00'
    },
    actions: ['延長預約'],
  }
]
</script>

<template>
  <h1>Profile</h1>
  <BookingFiliter />
  <ListView :data="data" />
</template>

<style scoped></style>