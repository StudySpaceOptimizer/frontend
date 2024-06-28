import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'

import * as Api from '@/api'
import DependencyContainer from '@/DependencyContainer'

export function useReservation() {
  const { t } = useI18n()
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
            text: t('profileView.cancel'),
            handler: () => cancelBooking(item.id)
          }
        ]
      } else if (beginTime < nowTime && nowTime < endTime && !item.exit) {
        item.actions = [
          {
            text: t('profileView.terminate'),
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

    const confirmText = `${t('profileView.cancelConfirmation', { seatID: reservation.seatID, date: reservation.date, beginTime: reservation.beginTime, endTime: reservation.endTime })}`

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
    const { t } = useI18n()
    await ElMessageBox.confirm(t('profileView.terminateConfirmation'), t('warning'), {
      confirmButtonText: t('confirm'),
      cancelButtonText: t('cancel'),
      type: 'warning'
    }).then(async () => {
      try {
        await reserveApi.terminateReservation(id)
        updateReservationData(1)
        ElMessage.success(t('profileView.terminateSuccess'))
      } catch (error: any) {
        ElMessage.error(error.message)
      }
    })
  }

  const getReservationData = async (filterCondition?: any) => {
    try {
      const data = await reserveApi.getMyReservations({
        pageSize: filterCondition?.pageSize || 10,
        pageOffset: filterCondition?.pageOffset
      })
      return transformReservations(data)
    } catch (error: any) {
      console.error(error)
      ElMessage.error("無法取得個人預約記錄")
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
    try {
      return await reserveApi.getPersonalReservationsCount()
    } catch (error: any) {
      console.error(error)
      return 0
    }
  }

  return { reservations, getReservationData, updateReservationData, getCount }
}
