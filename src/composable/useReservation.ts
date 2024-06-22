import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import * as Api from '@/api'
import DependencyContainer from '@/DependencyContainer'

export function useReservation() {
  const reserveApi = DependencyContainer.inject<Api.Reserve>(Api.API_SERVICE.RESERVE)

  const reservations = ref<any[]>([])

  const transformReservations = (res: any[]) => {
    return res.map((item) => {
      delete item.user

      const nowTime = new Date()
      const beginTime = new Date(item.beginTime)
      const endTime = new Date(item.endTime)

      if (beginTime > nowTime) {
        item.actions = [
          {
            text: '取消預約',
            handler: () => cancelBooking(item.id)
          }
        ]
      } else if (beginTime < nowTime && nowTime < endTime && !item.exit) {
        item.actions = [
          {
            text: '提前離開',
            handler: () => terminateBooking(item.id)
          }
        ]
      }

      item.date = beginTime.toLocaleDateString()
      item.beginTime = beginTime.toLocaleTimeString()
      item.endTime = endTime.toLocaleTimeString()
      return item
    })
  }

  const cancelBooking = async (id: string) => {
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

  const terminateBooking = async (id: string) => {
    await ElMessageBox.confirm('確定要提前離開嗎？', '提示', {
      confirmButtonText: '確定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      try {
        await reserveApi.terminateReservation(id)
        updateReservationData(1)
        ElMessage.success('提前離開成功')
      } catch (error: any) {
        ElMessage.error(error.message)
      }
    })
  }

  const getReservationData = async (filterCondition?: any) => {
    const data = await reserveApi.getPersonalReservations({
      pageSize: filterCondition?.pageSize || 10,
      pageOffset: filterCondition?.pageOffset
    })
    return transformReservations(data)
  }

  const updateReservationData = async (data: number): Promise<void> => {
    reservations.value = await getReservationData({
      pageSize: 10,
      pageOffset: Math.max(0, (data - 1) * 10)
    })
  }

  const getCount = async () => {
    return await reserveApi.getPersonalReservationsCount()
  }

  return { reservations, getReservationData, updateReservationData, getCount }
}
