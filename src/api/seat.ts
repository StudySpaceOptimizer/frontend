import type * as Type from '../types'
import { supabase } from '../service/supabase/supabase'
import { seatConverterFromDB, seatConverterToDB } from '../utils'
import { toLocalDateTime, parseTimeString } from './common'
import type { Seat, Config } from './index'
import { useSettingStore } from '../stores/setting'

interface SeatRequest {
  beginTime?: Date
  endTime?: Date
}

export class SupabaseSeat implements Seat {
  /**
   * 獲取所有座位的狀態，如果提供了開始和結束時間，則返回該時間範圍內座位的狀態
   * @url GET /api/seats?begin=begin&end=end
   * @param config 包含 beginTime 和 endTime 的配置對象
   * @returns 返回座位數據列表的 Promise
   */
  async getSeatsStatus(config: SeatRequest): Promise<Type.SeatData[]> {
    let { beginTime, endTime } = config
    if (Boolean(beginTime) !== Boolean(endTime)) {
      throw new Error('beginTime and endTime need to provide same time, or both not provide')
    }

    // 如果沒有給定config : beginTime = Now 的下一個時間段 或是 營業開始時間, endTime = 營業結束時間
    // 如果 now < 營業開始時間，beginTime = 營業開始時間
    // 如果 now > 營業結束時間，返回 'unavailable'
    const settingStore = useSettingStore()
    if (!settingStore.settings) throw new Error('系統錯誤，找不到設定')

    const now = new Date()
    const isWeekend = now.getDay() === 0 || now.getDay() === 6
    const openingHours = isWeekend
      ? settingStore.settings.weekendOpeningHours
      : settingStore.settings.weekdayOpeningHours

    let unavailable = false

    if (!beginTime || !endTime) {
      const openingTime = parseTimeString(openingHours.beginTime)
      const closingTime = parseTimeString(openingHours.endTime)

      beginTime = new Date(now.setHours(openingTime.hours, openingTime.minutes, 0, 0))
      endTime = new Date(now.setHours(closingTime.hours, closingTime.minutes, 0, 0))

      // 如果当前时间小于开业时间或超过闭店时间，处理逻辑
      if (now >= endTime) {
        unavailable = true
      } else if (now >= beginTime && now < endTime) {
        const nextPeriod = new Date(now)
        const minutes = nextPeriod.getMinutes()
        const hours = nextPeriod.getHours()

        if (minutes < 30 && minutes > 0) {
          nextPeriod.setMinutes(30, 0, 0)
        } else if (minutes > 30) {
          nextPeriod.setHours(hours + 1, 0, 0, 0)
        }

        beginTime = nextPeriod
      }
    }

    const { data: seatInfo, error: getSeatsError } = await supabase
      .from('seats')
      .select('*')
      .order('id', { ascending: true })

    if (getSeatsError) {
      throw new Error(getSeatsError.message)
    }

    const seatData: { [key: string]: Type.SeatData } = {}

    if (seatInfo == null) throw new Error('找不到座位')

    seatInfo.forEach((seat: any) => {
      const seatID = seatConverterFromDB(seat.id)
      seatData[seatID] = {
        id: seatID,
        available: seat.available,
        status: seat.available && !unavailable ? 'available' : 'unavailable', // 初始化狀態
        otherInfo: seat.other_info
      }
    })

    const { data: reservationsData, error: getActiveReservationError } = await supabase
      .from('active_seat_reservations')
      .select('*')
      .gte('begin_time', beginTime.toISOString())
      .lte('end_time', endTime.toISOString())
      .order('seat_id', { ascending: true })
      .order('begin_time', { ascending: true })

    if (getActiveReservationError) {
      throw new Error(getActiveReservationError.message)
    }

    interface TimeRange {
      start: Date
      end: Date
    }

    const seatCoverages: { [seatID: string]: TimeRange[] } = {}

    reservationsData?.forEach((reservation: any) => {
      const seatID = seatConverterFromDB(reservation.seat_id)
      if (!seatCoverages[seatID]) {
        seatCoverages[seatID] = [] // 初始化每個座位 ID 的陣列
      }

      seatCoverages[seatID].push({
        start: new Date(reservation.begin_time),
        end: new Date(reservation.end_time)
      })
    })

    Object.keys(seatCoverages).forEach((seatId) => {
      const coverage = seatCoverages[seatId]

      let currentEnd = beginTime

      // 可以用UTC時間比較
      coverage.forEach((time) => {
        if (time.start.toISOString() == currentEnd!.toISOString()) {
          currentEnd = time.end
        }
      })

      if (currentEnd! >= endTime!) {
        seatData[seatId].status = 'reserved'
      } else {
        seatData[seatId].status = 'partiallyReserved'
      }
    })

    return Object.values(seatData)
  }

  /**
   * Get the seats configurations, returns a Konva Object
   * TODO: 回傳的東西還沒想好，但這個基本上後端不會動，所以先假設一個任意 Object 回傳 (座位圖還沒做完)
   * @url GET /api/seats/configurations
   * @returns Promise<Response<any>>
   */
  getSeatsConfigurations(): Promise<any> {
    throw new Error('Method not implemented.')
  }

  /**
   * 獲取特定座位的狀態
   * @url GET /api/seats/:id
   * @param id 要查詢的座位ID
   * @returns 返回座位詳細資訊的 Promise
   */
  async getSeatStatus(
    config: Config,
    reservationFilter: Type.ReservationFilter
  ): Promise<Type.SeatDetail> {
    const { pageSize = 10, pageOffset = 0 } = config
    const { userID, userRole, seatID, beginTimeStart, beginTimeEnd, endTimeStart, endTimeEnd } =
      reservationFilter

    if (seatID == undefined) {
      throw new Error('座位編號錯誤')
    }

    const { data: reservations, error } = await supabase.rpc('get_seat_active_reservations', {
      page_size: pageSize,
      page_offset: pageOffset,
      filter_user_id: userID,
      filter_user_role: userRole,
      filter_seat_id: seatID,
      filter_begin_time_start: beginTimeStart,
      filter_begin_time_end: beginTimeEnd,
      filter_end_time_start: endTimeStart,
      filter_end_time_end: endTimeEnd
    })

    if (error) {
      throw new Error(error.message)
    }

    const seatDetail: Type.SeatDetail = {
      id: seatConverterFromDB(seatID),
      reservations:
        reservations?.map(
          (reservation: any): Type.Reservation => ({
            id: reservation.id,
            beginTime: new Date(reservation.begin_time),
            endTime: new Date(reservation.end_time),
            seatID: seatConverterFromDB(reservation.seat_id),
            checkInTime: reservation.check_in_time,
            temporaryLeaveTime: reservation.temporary_leave_time,
            user: {
              id: reservation.user_id,
              userRole: reservation.user_role,
              email: reservation.email,
              adminRole: reservation.admin_role,
              isVerified: reservation.is_verified,
              isIn: reservation.is_in,
              name: reservation.name,
              phone: reservation.phone,
              idCard: reservation.id_card,
              point: reservation.point,
              ban: reservation.blacklist
                ? {
                    reason: reservation.blacklist[0].reason,
                    endAt: new Date(reservation.blacklist[0].end_at)
                  }
                : undefined
            }
          })
        ) || []
    }

    return seatDetail
  }

  /**
   * 更新座位信息
   * @param seatId 座位 ID
   * @param available 座位是否可用
   * @param otherInfo 其他資訊
   * @returns 更新結果
   * 將座位轉變為不可使用(available = false)後，此座位將無法被預約，但是先前已經預約的不受影響
   */
  async updateSeat(seatID: string, available: boolean, otherInfo?: string): Promise<void> {
    const id = seatConverterToDB(seatID)
    const { data, error } = await supabase
      .from('seats')
      .update({
        available: available,
        other_info: otherInfo
      })
      .eq('id', id)

    if (error) {
      throw new Error(`更新座位失敗: ${error.message}`)
    }
  }
}
