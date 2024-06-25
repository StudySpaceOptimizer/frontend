<script setup lang="ts">
import { computed, reactive, ref, watch, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'

import { useSeatStore } from '@/stores/seat'
import { useFilterStore } from '@/stores/filter'
import * as api from '@/api'
import DependencyContainer from '@/DependencyContainer'
import { createTimeRange } from '@/utils'
import TimeSelect from './TimeSelect.vue'

const reserveApi = DependencyContainer.inject<api.Reserve>(api.API_SERVICE.RESERVE)
const seatApi = DependencyContainer.inject<api.Seat>(api.API_SERVICE.SEAT)
const seatStore = useSeatStore()
const filterStore = useFilterStore()
const route = useRoute()

const dialogVisible = ref(false)
const seatName = ref('')
const timeSelectRange = ref<string[]>([])
const timeRange = reactive(createTimeRange(8, 22, 30))

watchEffect(() => {
  if (seatStore.nowSelectedSeat != null) {
    dialogVisible.value = true
    seatName.value = seatStore.nowSelectedSeat
  }
})

function clearTimeSetting(): void {
  beginTime.value = undefined
  endTime.value = undefined
  timeSelectRange.value = []
  timeRange.forEach((time) => (time.disabled = false))
}

function handleClose(): void {
  dialogVisible.value = false
  seatStore.unselectSeat()
  clearTimeSetting()
}

const nowFilterDate = computed(() => {
  const filter = filterStore.getFilter(route.name?.toString() || 'default')
  if (!filter.beginTime) return new Date().toLocaleDateString()
  return filter.beginTime.toLocaleDateString()
})

const beginTime = ref<string | undefined>(undefined)
const endTime = ref<string | undefined>(undefined)
async function handleBooking(): Promise<void> {
  if (beginTime.value === undefined || endTime.value === undefined) {
    ElMessage.warning('請選擇預約時間')
    return
  }

  const beginTimeValue = new Date(`${nowFilterDate.value} ${beginTime.value}`)
  const endTimeValue = new Date(`${nowFilterDate.value} ${endTime.value}`)

  try {
    await reserveApi.reserve(seatName.value, beginTimeValue, endTimeValue)
    ElMessage.success('預約成功')
    dialogVisible.value = false
    seatStore.unselectSeat()
    clearTimeSetting()
    await fetchSeatsStatus()
  } catch (e: any) {
    ElMessage.error('預約失敗: ' + e.message)
  }
}

async function fetchSeatsStatus() {
  try {
    await seatStore.fetchSeatsStatus(filterStore.getFilter(route.name?.toString() || 'default'))
  } catch (e: any) {
    ElMessage.error('獲取座位狀態失敗: ' + e.message)
  }
}

const isCompleteSelectTime = computed(() => {
  return beginTime.value !== undefined && endTime.value !== undefined
})

function getTime(time: string) {
  const dateTime = new Date(time)
  dateTime.setHours(dateTime.getHours() - 8)
  return dateTime.toLocaleTimeString('en', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

const disabledTimes = ref<string[]>([])
watch(dialogVisible, async (value) => {
  if (value) {
    try {
      const data = await seatApi.getSeatStatus(seatName.value)
      const reservationsTime = data.reservations

      disabledTimes.value = []
      reservationsTime.forEach((reservation: any) => {
        const beginTime = getTime(reservation.beginTime)
        const endTime = getTime(reservation.endTime)

        disabledTimes.value.push(`${beginTime}-${endTime}`)
      })
    } catch (e: any) {
      console.error('獲取座位預約紀錄失敗: ', e.message)
      ElMessage.error('獲取座位預約紀錄失敗，該座位可能已被預約')
    }
  }
})

function selectTimeRange(timeRange: {
  beginTime: string | undefined
  endTime: string | undefined
}): void {
  beginTime.value = timeRange.beginTime
  endTime.value = timeRange.endTime
}
</script>
<template>
  <el-dialog
    v-model="dialogVisible"
    :title="`預約座位 ${seatName}`"
    width="500"
    :before-close="handleClose"
    destroy-on-close
  >
    <div class="date">預約日期：{{ nowFilterDate }}</div>
    <p>
      預約時間：
      <template v-if="beginTime && endTime"> {{ beginTime }} ~ {{ endTime }} </template>
      <template v-else>未選擇時間</template>
    </p>
    <TimeSelect @selectTimeRange="selectTimeRange" :disabledTimes="disabledTimes" />
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleBooking" :disabled="!isCompleteSelectTime">
          預約
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.time-selector {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
