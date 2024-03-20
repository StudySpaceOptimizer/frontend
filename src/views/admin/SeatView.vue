<script setup lang="ts">
import ListView from '@/components/ListView.vue'
import TheFilter from '@/components/TheFilter.vue'
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
  <TheFilter />
  <div class="map">
    <p>座位即時圖</p>
  </div>
</template>

<style scoped lang="scss">
.map {
  position: relative;
  margin-top: 16px;
  height: 500px;
  width: 80%;
  border-radius: 6px;
  background-color: #e8e8e8;

  p {
    font-size: 6em;
    display: block;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
}
</style>
