<script setup lang="ts">
import { computed, reactive, ref, watch, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

import { useSeatStore } from '@/stores/seat'
import { useFilterStore } from '@/stores/filter'
import * as api from '@/api'
import DependencyContainer from '@/DependencyContainer'
import { createTimeRange } from '@/utils'
import TimeSelect from './TimeSelect.vue'

const { t } = useI18n()
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
    ElMessage.warning(t('bookingModel.selectReservationTime'))
    return
  }

  const beginTimeValue = new Date(`${nowFilterDate.value} ${beginTime.value}`)
  const endTimeValue = new Date(`${nowFilterDate.value} ${endTime.value}`)

  try {
    await reserveApi.reserve(seatName.value, beginTimeValue, endTimeValue)
    ElMessage.success(t('bookingModel.reserveSuccess'))
    dialogVisible.value = false
    seatStore.unselectSeat()
    clearTimeSetting()
    await fetchSeatsStatus()
  } catch (e: any) {
    ElMessage.error(e.message)
  }
}

async function fetchSeatsStatus() {
  try {
    await seatStore.fetchSeatsStatus(filterStore.getFilter(route.name?.toString() || 'default'))
  } catch (e: any) {
    ElMessage.error(e.message)
  }
}

const isCompleteSelectTime = computed(() => {
  return beginTime.value !== undefined && endTime.value !== undefined
})

function getTime(time: string) {
  const dateTime = new Date(time)
  dateTime.setHours(dateTime.getHours() + 8)
  return dateTime.toLocaleTimeString('zh-tw', {
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
        console.log(reservation)
        const beginTime = getTime(reservation.beginTime)
        const endTime = getTime(reservation.endTime)

        console.log('beginTime: ', beginTime)
        console.log('endTime: ', endTime)

        disabledTimes.value.push(`${beginTime}-${endTime}`)
      })
    } catch (e: any) {
      console.error('獲取座位預約紀錄失敗: ', e.message)
      ElMessage.error(e.message)
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
    :title="$t('bookingModel.reserveSeat', { seatName })"
    width="500"
    :before-close="handleClose"
    destroy-on-close
  >
    <div class="date">{{ $t('bookingModel.reserveDate') }}: {{ nowFilterDate }}</div>
    <p>
      {{ $t('bookingModel.reserveTime') }}:
      <template v-if="beginTime && endTime"> {{ beginTime }} ~ {{ endTime }} </template>
      <template v-else>{{ $t('bookingModel.notSelectedTime') }}</template>
    </p>
    <TimeSelect @selectTimeRange="selectTimeRange" :disabledTimes="disabledTimes" />
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">{{ $t('cancel') }}</el-button>
        <el-button type="primary" @click="handleBooking" :disabled="!isCompleteSelectTime">
          {{ $t('bookingModel.reserve') }}
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
