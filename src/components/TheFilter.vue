<script setup lang="ts">
import { reactive, ref, watchEffect } from 'vue'
import { ElMessage } from 'element-plus'

import type { Filter } from '@/types'
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

const DateTimePicker = ref({
  date: new Date(),
  beginTime: '08:30',
  endTime: '20:30'
})

const filter = reactive<Filter>({
  begin: new Date(),
  end: new Date()
})

const doFilter = () => {
  if (!filter.begin || !filter.end) return
  if (filter.begin > filter.end) {
    ElMessage.error('開始時間不得晚於結束時間')
    return
  } else if (filter.begin.getTime() === filter.end.getTime()) {
    return
  }
  filterStore.setFilter(route.name?.toString() || 'default', {
    begin: filter.begin,
    end: filter.end
  })
}

watchEffect(() => {
  const date: string = DateTimePicker.value.date.toLocaleDateString().split('T')[0]
  filter.begin = new Date(`${date} ${DateTimePicker.value.beginTime}`)
  filter.end = new Date(`${date} ${DateTimePicker.value.endTime}`)
})
</script>

<template>
  <form @submit.prevent="doFilter">
    <template v-if="show.time">
      <div class="date-filter-item">
        <el-date-picker
          v-model="DateTimePicker.date"
          type="date"
          size="default"
        />
      </div>
      <div class="date-filter-item">
        <el-time-select
          v-model="DateTimePicker.beginTime"
          style="width: 240px"
          :max-time="DateTimePicker.endTime"
          class="mr-4"
          placeholder="開始時間"
          start="08:30"
          step="00:30"
          end="20:30"
        />
      </div>
      <div class="date-filter-item">
        <el-time-select
          v-model="DateTimePicker.endTime"
          style="width: 240px"
          :min-time="DateTimePicker.beginTime"
          placeholder="結束時間"
          start="08:30"
          step="00:30"
          end="20:30"
        />
      </div>
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
  width: 100%;
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

.date-filter-item {
  margin: 0 10px;
}
</style>
