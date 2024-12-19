<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

import type { Filter } from '@/types'
import { useFilterStore } from '@/stores/filter'
import { useSettingStore } from '@/stores/setting'
import { useRoute } from 'vue-router'

const { t } = useI18n()
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

function getOpeningHours(date: Date | string): {
  beginTime: string
  endTime: string
} {
  if (typeof date === 'string') {
    date = new Date(date)
  }

  const day = date.getDay()

  if (day === 0 || day === 6) {
    return settingStore.settings!.weekendOpeningHours
  }
  return settingStore.settings!.weekdayOpeningHours
}

const earliestStartTime = ref(getOpeningHours(new Date()).beginTime)
const latestEndTime = ref(getOpeningHours(new Date()).endTime)

// 現在時間要調整到後面的半小時
function getCanBookingTime() {
  const now = new Date()
  const nowHour = now.getHours()
  const nowMinute = now.getMinutes()

  const todayEarliest = new Date(`${now.toLocaleDateString()} ${earliestStartTime.value}`)
  const todayLatest = new Date(`${now.toLocaleDateString()} ${latestEndTime.value}`)

  // 如果現在時間不在開放時間內，返回最早可預訂時間
  if (now < todayEarliest || now > todayLatest) {
    return earliestStartTime.value
  }

  // 調整當前時間到下一個可預訂的半小時
  if (nowMinute < 30) {
    now.setMinutes(30, 0, 0)
  } else {
    now.setHours(nowHour + 1, 0, 0, 0)
  }

  const formattedHour = now.getHours().toString().padStart(2, '0')
  const formattedMinute = now.getMinutes().toString().padStart(2, '0')

  return `${formattedHour}:${formattedMinute}`
}

function getCanBookingDay(): Date {
  const now = new Date()
  const [latestHour, latestMinute] = latestEndTime.value.split(':').map(Number)

  const latestTimeToday = new Date(now)
  latestTimeToday.setHours(latestHour, latestMinute, 0, 0)

  if (now >= latestTimeToday) {
    now.setDate(now.getDate() + 1)
  }

  return now
}

function getReservationTimeUnit(): string {
  const duration = settingStore.getReservationTimeUnit()
  if (duration) {
    const hours = Math.floor(duration)
    const minutes = (duration - hours) * 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  return '00:30'
}

const DateTimePicker = ref({
  date: getCanBookingDay(),
  beginTime: getCanBookingTime(),
  endTime: latestEndTime
})

const filter = reactive<Filter>({
  beginTime: new Date(),
  endTime: new Date()
})

function doFilter(): void {
  if (!filter.beginTime || !filter.endTime) return
  if (filter.beginTime > filter.endTime) {
    ElMessage.error(t('filter.invalidTimeRange'))
    return
  } else if (filter.beginTime.getTime() === filter.endTime.getTime()) {
    return
  }
  filterStore.setFilter(route.name?.toString() || 'default', {
    beginTime: filter.beginTime,
    endTime: filter.endTime
  })
}

function isSelectToday(date: string | Date) {
  if (typeof date === 'string') {
    date = new Date(date)
  }

  return new Date().toLocaleDateString() === date.toLocaleDateString()
}

function pickingDateChangeHandler() {
  const date: string = DateTimePicker.value.date.toLocaleDateString().split('T')[0]
  earliestStartTime.value = getOpeningHours(DateTimePicker.value.date).beginTime
  latestEndTime.value = getOpeningHours(DateTimePicker.value.date).endTime
  if (!isSelectToday(date)) {
    DateTimePicker.value.beginTime = earliestStartTime.value
  } else {
    DateTimePicker.value.beginTime = getCanBookingTime()
  }

  filter.beginTime = new Date(`${date} ${DateTimePicker.value.beginTime}`)
  filter.endTime = new Date(`${date} ${DateTimePicker.value.endTime}`)
  doFilter()
}

watch(() => DateTimePicker.value.date, () => {
  pickingDateChangeHandler()
})

watch(() => DateTimePicker.value, () => {
  const date: string = DateTimePicker.value.date.toLocaleDateString().split('T')[0]

  filter.beginTime = new Date(`${date} ${DateTimePicker.value.beginTime}`)
  filter.endTime = new Date(`${date} ${DateTimePicker.value.endTime}`)
  doFilter()
}, { deep: true })

function checkDisabledDate(time: Date): boolean {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const offset = (settingStore.settings?.studentReservationLimit || 7) * 24 * 60 * 60 * 1000
  return time.getTime() < now.getTime() || time.getTime() > now.getTime() + offset
}

const timeSelectBeginTime = computed(() => {
  return isSelectToday(DateTimePicker.value.date) ? getCanBookingTime() : earliestStartTime.value
})

onMounted(() => {
  pickingDateChangeHandler()
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
          :start="timeSelectBeginTime"
          :step="getReservationTimeUnit()"
          :end="latestEndTime"
        />
      </div>
      <div class="date-filter-item">
        <el-time-select
          v-model="DateTimePicker.endTime"
          style="width: 240px"
          :min-time="DateTimePicker.beginTime"
          placeholder="結束時間"
          :start="timeSelectBeginTime"
          :step="getReservationTimeUnit()"
          :end="latestEndTime"
        />
      </div>
    </template>
    <el-button type="primary" style="margin: 0 10px">{{ t('filter') }}</el-button>
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
