import type * as Type from '../types'
import { supabase } from '../service/supabase/supabase'
import { seatConverterFromDB } from '../utils'

import { toLocalDateTime } from './common'
import type { Seat } from './index'

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
    const now = new Date() // 取得當前時間
    if (beginTime == undefined || endTime == undefined) {
      beginTime = new Date()
      endTime = new Date(now) // 創建一個新的 Date 物件，以當前時間為基礎
      endTime.setHours(23, 59, 59)
    }

    const { data: seatInfo, error: getSeatsError } = await supabase.from('seats').select('*')

    if (getSeatsError) {
      throw new Error(getSeatsError.message)
    }

    const seatData: { [key: string]: Type.SeatData } = {}

    if (seatInfo == null) throw new Error('找不到座位')

    seatInfo.forEach((seat: any) => {
      const seatId = seatConverterFromDB(seat.id)
      seatData[seatId] = {
        id: seatId,
        available: seat.available,
        status: seat.available ? 'available' : 'unavailable', // 初始化狀態
        otherInfo: seat.other_info
      }
    })

    const { data: reservationsData, error: getActiveReservationError } = await supabase
      .from('active_seat_reservations')
      .select('*')
      .gte('begin_time', beginTime.toLocaleString('en-us'))
      .lt('end_time', endTime.toLocaleString('en-us'))

    if (getActiveReservationError) {
      throw new Error(getActiveReservationError.message)
    }

    interface TimeRange {
      start: Date
      end: Date
    }

    const seatCoverages: { [seatId: string]: TimeRange[] } = {}

    reservationsData?.forEach((reservation: any) => {
      const seatId = seatConverterFromDB(reservation.seat_id)
      // TODO: 應該是在這個篩選區間內，如果都有預約才是 reserved，如果只有部分時間有預約，則是 partiallyReserved
      if (reservation.beginTime <= now && reservation.endTime > now) {
        seatData[seatId].status = 'reserved'
      } else {
        seatData[seatId].status = 'partiallyReserved'
      }
    })

    const seatDataArray = Object.values(seatData)

    return seatDataArray
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
  async getSeatStatus(seatID: number): Promise<Type.SeatDetail> {
    const { data: active_seat_reservations, error } = await supabase.rpc(
      'get_seat_active_reservations',
      {
        seatID
      }
    )

    if (error) {
      throw new Error(error.message)
    }

    const seatDetail: Type.SeatDetail = {
      id: seatConverterFromDB(seatID),
      reservations:
        active_seat_reservations?.map((reservation: any) => ({
          beginTime: toLocalDateTime(reservation.begin_time),
          endTime: toLocalDateTime(reservation.end_time),
          user: {
            id: reservation.user_id,
            email: reservation.email,
            userRole: reservation.user_role,
            adminRole: reservation.admin_role,
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
        })) || []
    }

    return seatDetail
  }
}
