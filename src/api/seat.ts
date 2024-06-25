import type * as Type from '../types'
import { supabase } from '../service/supabase/supabase'
import { seatConverterFromDB, seatConverterToDB } from '../utils'
import { toLocalDateTime, parseTimeString } from './common'
import type { Seat } from './index'
import { useSettingStore } from '../stores/setting'

export class SupabaseSeat implements Seat {
  /**
   * 獲取所有座位的狀態，可選擇性地根據時間範圍來獲取
   * @url GET /api/seats?begin=begin&end=end
   * @param seatReservationFilterByTime 包含開始時間和結束時間的過濾條件
   * @returns 返回座位數據列表
   */
  async getSeatsStatus(
    seatReservationFilterByTime: Type.SeatReservationFilterByTime
  ): Promise<Type.SeatData[]> {
    let { beginTime, endTime } = seatReservationFilterByTime

    // 檢查時間參數是否同時提供或同時不提供
    if (Boolean(beginTime) !== Boolean(endTime)) {
      throw new Error('開始時間和結束時間必須同時提供或同時不提供')
    }

    /*
      如果沒有給定 filter，beginTime = 'Now 的下一個時間段'或是'營業開始時間', endTime = 營業結束時間
      如果 now < 營業開始時間，beginTime = 營業開始時間
      如果 now > 營業結束時間，返回 'unavailable'
    */
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

      // 處理當前時間超出營業時間的情況
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
   * 獲取特定座位的當前狀態和預約情況
   * @url GET /api/seats/:id
   * @param config 包含分頁配置
   * @param reservationFilter 包含座位和用戶的過濾條件
   *@returns 返回詳細的座位預約信息
   */
  async getSeatStatus(
    pageFilter: Type.PageFilter,
    reservationFilter: Type.ReservationFilter
  ): Promise<Type.SeatDetail> {
    const { pageSize = 10, pageOffset = 0 } = pageFilter
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
   * 更新指定座位的可用狀態及其他信息
   * @url PUT /api/seats/:id
   * @param seatId 座位 ID
   * @param available 是否可用
   * @param otherInfo 其他相關信息
   * @returns 操作無回傳值，錯誤將拋出異常
   */
  async updateSeat(seatId: string, available: boolean, otherInfo?: string): Promise<void> {
    const id = seatConverterToDB(seatId)
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
