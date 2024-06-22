<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

import * as Api from '@/api'
import DependencyContainer from '@/DependencyContainer'
import { ElMessage } from 'element-plus'

const seatApi = DependencyContainer.inject<Api.Seat>(Api.API_SERVICE.SEAT)

let cacheSeats: any[] = []
const seats = ref<any[]>([])
const count = ref(0)
const search = ref('')

async function getSeatDataWithCache() {
  try {
    if (cacheSeats.length === 0) {
      cacheSeats = await seatApi.getSeatsStatus({})
    }
    return cacheSeats.filter((seat) => seat.id.includes(search.value))
  } catch (error: any) {
    ElMessage.error(error.message)
    return []
  }
}

async function getSeatDataPage(pageSize: number, pageOffset: number) {
  const data = await getSeatDataWithCache()
  return data.slice(pageSize * pageOffset, pageSize * (pageOffset + 1))
}

async function getSeatDataCount() {
  const data = await getSeatDataWithCache()
  return data.length
}

async function handleCurrentChange(val: number) {
  seats.value = await getSeatDataPage(10, val - 1)
}

async function updateSeatData() {
  seats.value = await getSeatDataPage(10, 0)
  count.value = await getSeatDataCount()
}

onMounted(() => {
  updateSeatData()
})

watch(search, () => {
  updateSeatData()
})

const loading = ref(new Map<string, boolean>())
function changeSeatStatus(seat: any) {
  return async () => {
    loading.value.set(seat.id, true)

    try {
      await seatApi.updateSeat(seat.id, !seat.available)
      loading.value.set(seat.id, false)
      ElMessage.success(`座位 ${seat.id} 狀態已更新`)
      return true
    } catch (error: any) {
      loading.value.set(seat.id, false)
      ElMessage.error(error.message)
      return false
    }
  }
}
</script>

<template>
  <el-table :data="seats" stripe style="width: 100%; height: 550px">
    <el-table-column prop="id" label="座位編號" width="360" />
    <el-table-column prop="available" label="可用狀態">
      <template #default="{ row }">
        <el-switch
          v-model="row.available"
          active-text="可用"
          inactive-text="不可用"
          inline-prompt
          width="60"
          style="--el-switch-off-color: #ff4949"
          :loading="loading.get(row.id)"
          :before-change="changeSeatStatus(row)"
        />
      </template>
    </el-table-column>
    <el-table-column align="right">
      <template #header>
        <el-input v-model="search" placeholder="搜尋座位編號" />
      </template>
    </el-table-column>
  </el-table>
  <el-pagination
    layout="prev, pager, next"
    :total="count"
    :page-size="10"
    @current-change="handleCurrentChange"
    style="margin-top: 10px; justify-content: center"
  />
</template>

<style scoped lang="scss"></style>
