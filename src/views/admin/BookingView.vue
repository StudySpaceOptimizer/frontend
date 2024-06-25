<script setup lang="ts">
import { ref, onMounted } from 'vue'

import * as Types from '@/types'
import * as Api from '@/api'
import DependencyContainer from '@/DependencyContainer'
import { ElMessage, ElMessageBox } from 'element-plus'

const reserveApi = DependencyContainer.inject<Api.Reserve>(Api.API_SERVICE.RESERVE)
const reservations = ref<any[]>([])

function transformReservations(res: any[]) {
  return res.map((item) => {
    const nowTime = new Date()
    const beginTime = new Date(item.beginTime)
    const endTime = new Date(item.endTime)

    if (beginTime > nowTime) {
      item.actions = [
        {
          text: '刪除預約',
          handler: () => cancelBooking(item.id)
        }
      ]
    }

    item.date = beginTime.toLocaleDateString()
    item.beginTime = beginTime.toLocaleTimeString()
    item.endTime = endTime.toLocaleTimeString()
    return item
  })
}

async function cancelBooking(id: string) {
  const reservation = reservations.value.find((item) => item.id === id)

  const confirmText = `確定要取消 ${reservation.seatID} 預約嗎？<br />
    預約時間：${reservation.date} ${reservation.beginTime} - ${reservation.endTime}`

  await ElMessageBox.confirm(confirmText, '提示', {
    confirmButtonText: '確定',
    cancelButtonText: '取消',
    type: 'warning',
    dangerouslyUseHTMLString: true
  }).then(async () => {
    try {
      await reserveApi.deleteReservation(id)
      ElMessage.success('取消預約成功')
      updateReservationData(1)
    } catch (error: any) {
      ElMessage.error(error.message)
    }
  })
}

async function getReservationData(pageFilter: Types.PageFilter) {
  try {
    const data = await reserveApi.getReservations(pageFilter)
    return transformReservations(data)
  } catch (error: any) {
    ElMessage.error(error.message)
    return []
  }
}

async function updateReservationData(data: number): Promise<void> {
  reservations.value = await getReservationData({
    pageSize: 10,
    pageOffset: Math.max(0, (data - 1) * 10)
  })
}

async function getCount() {
  return await reserveApi.getAllReservationsCount()
}

const count = ref(0)
function handleCurrentChange(val: number) {
  updateReservationData(val)
}

onMounted(() => {
  updateReservationData(1)
  getCount().then((res) => {
    count.value = res
  })
})
</script>

<template>
  <el-table :data="reservations" stripe style="width: 100%; height: 460px">
    <el-table-column prop="date" label="日期" width="120" />
    <el-table-column prop="beginTime" label="開始時間" width="120" />
    <el-table-column prop="endTime" label="結束時間" width="120" />
    <el-table-column prop="seatID" label="座位" width="60" />
    <el-table-column prop="user.email" label="Email" width="360" />
    <el-table-column prop="user.name" label="名字" />
    <el-table-column fixed="right" label="操作">
      <template #default="scope">
        <div v-for="action in reservations[scope.$index].actions" :key="action">
          <el-button link type="primary" size="small" @click="action.handler">{{
            action.text
          }}</el-button>
        </div>
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
