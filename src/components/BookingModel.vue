<script setup lang="ts">
import { computed, reactive, ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'

import { useSeatStore } from '@/stores/seat'
import { useFilterStore } from '@/stores/filter'
import * as api from '@/api'
import DependencyContainer from '@/DependencyContainer'
import { createTimeRange } from '@/utils'

const reserveApi = DependencyContainer.inject<api.Reserve>(api.API_SERVICE.RESERVE)
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

const clearTimeSetting = () => {
  beginTime.value = undefined
  endTime.value = undefined
  oldCheckboxGroup1 = []
  timeSelectRange.value = []
  timeRange.forEach((time) => (time.disabled = false))
}

const handleClose = () => {
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
let oldCheckboxGroup1: string[] = []
const handleBooking = () => {
  if (beginTime.value === undefined || endTime.value === undefined) {
    ElMessage.warning('請選擇預約時間')
    return
  }

  const beginTimeValue = new Date(`${nowFilterDate.value} ${beginTime.value}`)
  const endTimeValue = new Date(`${nowFilterDate.value} ${endTime.value}`)
  reserveApi
    .reserve(seatName.value, beginTimeValue, endTimeValue)
    .then(() => {
      ElMessage.success('預約成功')
      dialogVisible.value = false
      seatStore.unselectSeat()
      clearTimeSetting()
    })
    .catch((e) => {
      ElMessage.error('預約失敗:' + e.message)
    })
}

const findSelectedTime = (oldValue: string[], newValue: string[]) => {
  if (oldValue.length < newValue.length) {
    return newValue.find((value) => !oldValue.includes(value))
  } else if (oldValue.length > newValue.length) {
    return oldValue.find((value) => !newValue.includes(value))
  }
  return undefined
}

const handleCheckboxChange = (value: string[]) => {
  const nowSelectedTime = findSelectedTime(oldCheckboxGroup1, value)

  if (beginTime.value === nowSelectedTime) {
    beginTime.value = undefined
  } else if (endTime.value === nowSelectedTime) {
    endTime.value = undefined
  } else if (beginTime.value === undefined) {
    beginTime.value = nowSelectedTime
  } else if (endTime.value === undefined) {
    endTime.value = nowSelectedTime
  } else {
    ElMessage.warning('你ㄧ次只能選擇一個連續區間')
  }

  const beginIndex = timeRange.findIndex((time) => time.value === beginTime.value)
  const endIndex = timeRange.findIndex((time) => time.value === endTime.value)
  timeRange.forEach((time, index) => {
    if (endIndex === -1) {
      time.disabled = index < beginIndex
    } else {
      time.disabled = index < beginIndex || index > endIndex
    }
  })

  if (beginTime.value != undefined && endTime.value != undefined) {
    timeSelectRange.value = timeRange.slice(beginIndex, endIndex + 1).map((time) => time.value)
  } else {
    timeSelectRange.value = [beginTime.value, endTime.value].filter(
      (time) => time != undefined
    ) as string[]
  }
  oldCheckboxGroup1 = timeSelectRange.value
}

const isCompleteSelectTime = computed(() => {
  return beginTime.value !== undefined && endTime.value !== undefined
})
</script>
<template>
  <el-dialog
    v-model="dialogVisible"
    :title="`預約座位 ${seatName}`"
    width="500"
    :before-close="handleClose"
  >
    <div class="date">預約日期：{{ nowFilterDate }}</div>

    <div class="time-selector">
      <el-checkbox-group v-model="timeSelectRange" size="large" @change="handleCheckboxChange">
        <el-checkbox-button
          v-for="time in timeRange"
          :key="time.value"
          :value="time.value"
          :disabled="time.disabled"
        >
          {{ time.value }}
        </el-checkbox-button>
      </el-checkbox-group>
    </div>

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
