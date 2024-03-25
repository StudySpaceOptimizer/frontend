<script setup lang="ts">
import ListView from '@/components/ListView.vue'
import TheFilter from '@/components/TheFilter.vue'
import type { Data } from '@/components/ListViewType'

const data: Data[] = [
  {
    id: 1,
    // range: {
    //   date: '2024-01-01',
    //   start: '09:00',
    //   end: '10:00'
    // },
    // seat: 'A1',
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
    actions: ['解除禁止']
  },
  {
    id: 1,
    // range: {
    //   date: '2024-01-01',
    //   start: '09:00',
    //   end: '10:00'
    // },
    // seat: 'A1',
    user: {
      id: 1,
      name: 'user2',
      identity: '校外人士',
      email: 'user2@com',
      ban: {
        points: 5
        // banned: '2024-01-15',
        // until: '2024-01-18'
      }
    },
    actions: ['加點']
  }
]
</script>

<template>
  <TheFilter />
  <ListView :data="data" />
</template>
