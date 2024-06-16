<script setup lang="ts">
import { useFilterStore } from '@/stores/filter'
import { useSettingStore } from '@/stores/setting'
import { ElMessage } from 'element-plus'
import { onMounted, ref, watch } from 'vue'

interface TimeRange {
  begin: string
  end: string
  disabled: boolean
  selected: boolean
  reserved: boolean
}

const props = defineProps<{
  disabledTimes: string[]
}>()

const { getFilter } = useFilterStore()
const { getMinimumReservationDuration, getMaximumReservationDuration } = useSettingStore()
function isDisabledTime(beginTime: string, endTime: string): boolean {
  let flag = false
  props.disabledTimes.forEach((time) => {
    const [begin, end] = time.split('-')
    if (begin <= beginTime && endTime <= end) {
      flag = true
      return
    }
  })
  return flag
}
// TODO: move to utils, and use toLocaleTimeString
function getHourAndMinute(time?: Date): string | undefined {
  if (time === undefined) return undefined
  return `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`
}

const earliestBeginTime = getHourAndMinute(getFilter().beginTime) || '08:00'
const latestEndTime = getHourAndMinute(getFilter().endTime) || '22:00'
const stepTime = getMinimumReservationDuration() * 60
function theNextTime(time: string): string {
  let [hour, minute] = time.split(':').map(Number)
  let nextMinute = minute + stepTime
  if (nextMinute >= 60) {
    hour += Math.floor(nextMinute / 60)
    nextMinute %= 60
  }
  return `${hour.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`
}

const timeRange = ref<TimeRange[]>([])
function initTimeRange() {
  let startTime = earliestBeginTime

  while (startTime < latestEndTime) {
    const endTime = theNextTime(startTime)
    timeRange.value.push({
      begin: startTime,
      end: endTime,
      reserved: isDisabledTime(startTime, endTime),
      selected: false,
      disabled: false
    })
    startTime = endTime
  }
}

const beginRange = ref<TimeRange | undefined>(undefined)
const endRange = ref<TimeRange | undefined>(undefined)

function setBeginAndEndRange(time: TimeRange) {
  // the first time to select
  if (beginRange.value === undefined && endRange.value !== time) {
    beginRange.value = time
  }
  // the second time to select
  else if (endRange.value === undefined && beginRange.value !== time) {
    endRange.value = time
  }
  // the cancel first time to select
  else if (beginRange.value === time) {
    beginRange.value = undefined
    endRange.value = undefined
  }
  // the cancel second time to select
  else if (endRange.value === time) {
    endRange.value = undefined
  }
  // select the other time
  else {
    return false
  }

  return true
}

function updateRangeTimeSelected() {
  if (beginRange.value === undefined || endRange.value === undefined) {
    timeRange.value.forEach(
      (time) => (time.selected = time == beginRange.value || time == endRange.value)
    )
    return
  }

  const begin = timeRange.value.findIndex((time) => time === beginRange.value)
  const end = timeRange.value.findIndex((time) => time === endRange.value)

  for (let i = begin; i <= end; ++i) {
    timeRange.value[i].selected = true
  }
}

function checkExceedMaxReservationDuration(beginTime: string | undefined, time: string) {
  if (beginTime === undefined) return false
  const duration = getMaximumReservationDuration()
  const now = new Date()
  const begin = new Date(`${now.toLocaleDateString()} ${beginTime}`).getTime()
  const end = new Date(`${now.toLocaleDateString()} ${time}`).getTime()
  return end - begin > duration * 60 * 60 * 1000
}

function updateRangeTimeDisabled() {
  let begin = timeRange.value.findIndex((time) => time === beginRange.value)
  let end = timeRange.value.findIndex((time) => time === endRange.value)

  if (begin == -1) {
    timeRange.value.forEach((time) => (time.disabled = false))
    return
  }
  if (end == -1) end = timeRange.value.length - 1

  for (let i = 0; i < timeRange.value.length; ++i) {
    timeRange.value[i].disabled =
      i < begin ||
      i > end ||
      checkExceedMaxReservationDuration(beginRange.value?.begin, timeRange.value[i].end)
  }

  let isBooked = false
  for (let i = begin; i < timeRange.value.length; ++i) {
    isBooked = isBooked || timeRange.value[i].reserved
    timeRange.value[i].disabled = isBooked || timeRange.value[i].disabled
  }
}

const emit = defineEmits(['selectTimeRange'])
function handlerTimeSelect(timeRange: TimeRange): void {
  if (!setBeginAndEndRange(timeRange)) {
    ElMessage.warning('你ㄧ次只能選擇一個連續區間')
    return
  }
  updateRangeTimeSelected()
  updateRangeTimeDisabled()
  emit('selectTimeRange', {
    beginTime: beginRange.value?.begin || endRange.value?.begin,
    endTime: endRange.value?.end || beginRange.value?.end
  })
}

onMounted(() => {
  initTimeRange()
})

watch(
  () => props.disabledTimes,
  () => {
    timeRange.value.forEach((time) => {
      time.reserved = isDisabledTime(time.begin, time.end)
    })
  }
)
</script>

<template>
  <el-container class="select-container">
    <div class="select-group">
      <el-row v-for="time in timeRange" :key="time.begin" style="padding: 2px;">
        <el-col :span="12" class="time-label">{{ time.begin }} ~ {{ time.end }}</el-col>
        <el-col :span="12">
          <el-button
            :disabled="time.disabled || time.reserved"
            :type="time.selected ? 'primary' : ''"
            :class="{ 'is-booked': time.reserved }"
            @click="handlerTimeSelect(time)"
          >
            {{
              time.reserved
                ? '已被預約'
                : time.disabled
                  ? '不可選擇'
                  : time.selected
                    ? '取消選擇'
                    : '選擇'
            }}
          </el-button>
        </el-col>
      </el-row>
    </div>
  </el-container>
</template>

<style scoped>
.select-container {
  display: flex;
  justify-content: center;
}

.select-group {
  width: 60%;
}

.el-button {
  width: 100%;
}

.el-button + .el-button {
  margin-left: 0;
}

.time-label {
  font-family: Consolas, Monaco, monospace;
  text-align: center;
  line-height: 32px;
}

.is-booked {
  color: var(--color-booked) !important;
}
</style>
