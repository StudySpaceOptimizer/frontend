import { ElMessage, ElMessageBox } from 'element-plus'

import * as Api from '@/api'
import DependencyContainer from '@/DependencyContainer'
import * as Type from '@/types'

export function useReservation() {
  const reserveApi = DependencyContainer.inject<Api.Reserve>(Api.API_SERVICE.RESERVE)
  let cacheFilterCondition: Type.Filter | undefined

  // TODO: 
  const transformReservations = (res: any[]) => {
    return res.map(item => {
      item.user = null  // 移除個人信息

      const nowTime = new Date().getTime()
      const beginTime = new Date(item.beginTime).getTime()

      if (beginTime > nowTime) {
        item.actions = [
          {
            text: '取消預約',
            handler: () => cancelBooking(item.id)
          }
        ]
      } else if (beginTime < nowTime && item.end > nowTime && !item.exit) {
        item.actions = [
          {
            text: '提前離開',
            handler: () => terminateBooking(item.id)
          }
        ]
      }
      return item
    })
  }

  const cancelBooking = async (id: string) => {
    await ElMessageBox.confirm('確定要取消預約嗎？' + id, '提示', {
      confirmButtonText: '確定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      try {
        await reserveApi.deleteReservation(id)
        ElMessage.success('取消預約成功')
        updateReservationData()
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
        updateReservationData()
      } catch (error: any) {
        ElMessage.error(error.message)
      }
    })
  }

  const getReservationData = async (filterCondition?: Type.Filter) => {
    // if filterCondition is not provided, use the last filter condition
    if (filterCondition !== undefined) {
      cacheFilterCondition = filterCondition
    } else {
      filterCondition = cacheFilterCondition
    }

    const data = await reserveApi.getPersonalReservations(filterCondition)
    return transformReservations(data)
  }

  const updateReservationData = async (): Promise<void> => {
    await getReservationData()
  }

  return { getReservationData }
}
