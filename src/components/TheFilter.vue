<script setup lang="ts">
import { reactive } from 'vue'
import type { Filter } from '@/types'
import { filterToUrlQuery } from '@/utils'
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

const filter = reactive<Filter>({
  start: new Date(),
  end: new Date(),
})

const doFilter = () => {
  filterStore.setFilter(route.name?.toString() || 'default', filter)
  const query = filterToUrlQuery(filter)
  console.log(query)
}
</script>

<template>
  <form @submit.prevent="doFilter">
    <template v-if="show.time">
      <label for="start">開始時間</label>
      <input v-model="filter.start" type="datetime-local" name="start" step="1800" />

      <label for="end">結束時間</label>
      <input v-model="filter.end" type="datetime-local" name="end" />
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
