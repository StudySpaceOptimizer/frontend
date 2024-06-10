<script setup lang="ts">
import { reactive, ref, watchEffect } from 'vue'
import { ElMessage } from 'element-plus'

import type { Filter } from '@/types'
import { useFilterStore } from '@/stores/filter'
import { useSettingStore } from '@/stores/setting'
import { useRoute } from 'vue-router'

const settingStore = useSettingStore()
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

function getTodayOpeningHours(): {
  beginTime: string
  endTime: string
} {
  const day = new Date().getDay()

  if (day === 0 || day === 6) {
    return settingStore.settings!.weekendOpeningHours
  }
  return settingStore.settings!.weekdayOpeningHours
}

const earliestStartTime = getTodayOpeningHours().beginTime
const latestEndTime = getTodayOpeningHours().endTime

// TODO: rename this
// 現在時間要調整到後面的半小時
function nowTimeToCanBookingTime() {
  const now = new Date()
  const nowHour = now.getHours()
  const nowMinute = now.getMinutes()

  if (now.getHours().toString() >= latestEndTime.split(':')[0]) {
    return earliestStartTime
  }

  if (nowMinute < 30) {
    now.setMinutes(30)
  } else {
    now.setHours(nowHour + 1, 0)
  }

  const formattedHour = now.getHours().toString().padStart(2, '0')
  const formattedMinute = now.getMinutes().toString().padStart(2, '0')

  return `${formattedHour}:${formattedMinute}`
}

function getNowCanBookingDay(): Date {
  const now = new Date()
  // TODO: optimize, don't use string compare, use Date compare
  if (now.getHours().toString() >= latestEndTime.split(':')[0]) {
    now.setDate(now.getDate() + 1)
  }

  return now
}

function getMinimumReservationDuration(): string {
  const duration = settingStore.settings?.minimumReservationDuration
  if (duration) {
    const hours = Math.floor(duration)
    const minutes = (duration - hours) * 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  return '00:30'
}

const DateTimePicker = ref({
  // TODO: if nowtime > endTime, date must be tomorrow
  date: getNowCanBookingDay(),

  // TODO: [1] use now time
  beginTime: nowTimeToCanBookingTime(),
  endTime: latestEndTime
})

const filter = reactive<Filter>({
  beginTime: new Date(),
  endTime: new Date()
})

function doFilter(): void {
  if (!filter.beginTime || !filter.endTime) return
  if (filter.beginTime > filter.endTime) {
    ElMessage.error('開始時間不得晚於結束時間')
    return
  } else if (filter.beginTime.getTime() === filter.endTime.getTime()) {
    return
  }
  filterStore.setFilter(route.name?.toString() || 'default', {
    beginTime: filter.beginTime,
    endTime: filter.endTime
  })
}

watchEffect(() => {
  const date: string = DateTimePicker.value.date.toLocaleDateString().split('T')[0]
  filter.beginTime = new Date(`${date} ${DateTimePicker.value.beginTime}`)
  filter.endTime = new Date(`${date} ${DateTimePicker.value.endTime}`)
  doFilter()
})

function checkDisabledDate(time: Date): boolean {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  // TODO: use setting set
  const offset = 14 * 24 * 60 * 60 * 1000
  return time.getTime() < now.getTime() || time.getTime() > now.getTime() + offset
}
</script>

<template>
  <form @submit.prevent="doFilter">
    <template v-if="show.time">
      <div class="date-filter-item">
        <el-date-picker
          v-model="DateTimePicker.date"
          type="date"
          size="default"
          :disabled-date="checkDisabledDate"
        >
        </el-date-picker>
      </div>
      <div class="date-filter-item">
        <el-time-select
          v-model="DateTimePicker.beginTime"
          style="width: 240px"
          :max-time="DateTimePicker.endTime"
          class="mr-4"
          placeholder="開始時間"
          :start="nowTimeToCanBookingTime()"
          :step="getMinimumReservationDuration()"
          :end="latestEndTime"
        />
      </div>
      <div class="date-filter-item">
        <el-time-select
          v-model="DateTimePicker.endTime"
          style="width: 240px"
          :min-time="DateTimePicker.beginTime"
          placeholder="結束時間"
          :start="nowTimeToCanBookingTime()"
          :step="getMinimumReservationDuration()"
          :end="latestEndTime"
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
    <el-button type="primary" style="margin: 0 10px">開始篩選</el-button>
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
