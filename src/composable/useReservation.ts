import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'

import * as Api from '@/api'
import DependencyContainer from '@/DependencyContainer'

export function useReservation() {
  const { t } = useI18n()
  const reserveApi = DependencyContainer.inject<Api.Reserve>(Api.API_SERVICE.RESERVE)

  const reservations = ref<any[]>([])
  const count = ref(0)

  const transformReservations = (res: any[]) => {
    return res.map((item) => {
      delete item.user
      console.log(item)

      const nowTime = new Date()
      const beginTime = new Date(item.beginTime)
      const endTime = new Date(item.endTime)

      beginTime.setHours(beginTime.getHours() + 8)
      endTime.setHours(endTime.getHours() + 8)

      if (beginTime > nowTime) {
        item.actions = [
          {
            text: t('profileView.cancel'),
            handler: () => cancelBooking(item.reservationId)
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
    const reservation = reservations.value.find((item) => item.reservationId === id)

    const confirmText = `${t('profileView.cancelConfirmation', { seatID: reservation.seatId, date: reservation.date, beginTime: reservation.beginTime, endTime: reservation.endTime })}`

    await ElMessageBox.confirm(confirmText, t('warning'), {
      confirmButtonText: t('confirm'),
      cancelButtonText: t('cancel'),
      type: 'warning',
      dangerouslyUseHTMLString: true
    }).then(async () => {
      try {
      await reserveApi.deleteReservation(id)
      ElMessage.success(t('profileView.cancelSuccess'))
      updateReservationData(1)
      } catch (error: any) {
      ElMessage.error(error.message)
      }
    })
  }

  const terminateBooking = async (id: string) => {
    throw new Error('Not implemented')
  }

  const getReservationData = async (filterCondition?: any) => {
    try {
      const data = await reserveApi.getMyReservations({
        pageSize: filterCondition?.pageSize || 10,
        pageOffset: filterCondition?.pageOffset
      })
      count.value = data.total
      return transformReservations(data.data)
    } catch (error: any) {
      console.error(error)
      ElMessage.error(error.message)
      return []
    }
  }

  const updateReservationData = async (data: number): Promise<void> => {
    reservations.value = await getReservationData({
      pageSize: 10,
      pageOffset: Math.max(0, (data - 1) * 10)
    })
  }

  const getCount = async () => {
    return count.value
  }

  return { reservations, getReservationData, updateReservationData, getCount }
}
