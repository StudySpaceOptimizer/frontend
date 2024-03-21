<script setup lang="ts">
import { reactive, computed } from 'vue'

import type { Filter } from '@/types'
import { timeToString } from '@/utils'
import { useFilterStore } from '@/stores/filter'
import { useRoute } from 'vue-router'

const filterStore = useFilterStore()
const route = useRoute()
const show = defineProps({
  time: {
    type: Boolean,
    default: true
  },
  identity: {
    type: Boolean,
    default: false
  },
  seat: {
    type: Boolean,
    default: false
  },
  username: {
    type: Boolean,
    default: false
  }
})

const adjustTimeToDateStep = (time?: Date, stepInSeconds: number = 1800): Date => {
  if (!time) return new Date()
  const secondsSinceMidnight = time.getHours() * 3600 + time.getMinutes() * 60 + time.getSeconds()
  const adjustedSeconds = Math.floor(secondsSinceMidnight / stepInSeconds) * stepInSeconds
  const adjustedDate = new Date(time)
  adjustedDate.setHours(
    Math.floor(adjustedSeconds / 3600),
    Math.floor((adjustedSeconds % 3600) / 60),
    0,
    0
  )
  return adjustedDate
}

const filter = reactive<Filter>({
  begin: adjustTimeToDateStep(new Date()),
  end: adjustTimeToDateStep(new Date()),
})

const inputFilterBegin = computed<string>({
  get: () => timeToString(filter.begin),
  set: (value: string) => (filter.begin = adjustTimeToDateStep(new Date(value)))
})

const inputFilterEnd = computed<string>({
  get: () => timeToString(filter.end),
  set: (value: string) => (filter.end = adjustTimeToDateStep(new Date(value)))
})

const doFilter = () => {
  if (!filter.begin || !filter.end) return
  if (filter.begin > filter.end) {
    alert('開始時間不得晚於結束時間')
    return
  } else if (filter.begin.getTime() === filter.end.getTime()) {
    return
  }
  filterStore.setFilter(route.name?.toString() || 'default', {
    begin: filter.begin,
    end: filter.end
  })
}
</script>

<template>
  <form @submit.prevent="doFilter">
    <template v-if="show.time">
      <label for="start">開始時間</label>
      <input v-model="inputFilterBegin" type="datetime-local" name="start" />

      <label for="end">結束時間</label>
      <input v-model="inputFilterEnd" type="datetime-local" name="end" />
    </template>

    <template v-if="show.identity">
      <label>身份</label>
      <select v-model="filter.identity">
        <option value="student">學生</option>
        <option value="others">校外人士</option>
      </select>
    </template>

    <template v-if="show.seat">
      <label for="seat">座位編號</label>
      <input v-model="filter.seat" type="text" name="seat" />
    </template>

    <template v-if="show.username">
      <label for="username">使用者</label>
      <input v-model="filter.username" type="text" name="username" />
    </template>
    <input type="submit" value="開始篩選" />
  </form>
</template>

<style scoped lang="scss">
form {
  display: flex;
  justify-content: center;
  background-color: gray;
  border-radius: 6px;
  width: 80%;
  padding: 20px;

  label,
  input {
    margin: 0 10px;
    font-size: 1.2em;
  }

  label {
    color: white;
  }
}
</style>
