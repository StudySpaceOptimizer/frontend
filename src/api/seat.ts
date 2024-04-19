import type * as model from './model'
import { toLocalDateTime } from './common'
import type { Seat } from './index'
import { supabase } from '../service/supabase/supabase'

interface SeatRequest {
  beginTime?: Date
  endTime?: Date
}

export class SupabaseSeat implements Seat {
  /**
   * Get all the seats, returns a list of seats
   * if begin time and end time is provided, returns the status of the seats in the range
   * @url GET /api/seats?begin=begin&end=end
   * @returns Promise<Response<SeatData[]>>
   */
  async getSeatsStatus(config: SeatRequest): Promise<model.SeatData[]> {
    let { beginTime, endTime } = config
    if (Boolean(beginTime) !== Boolean(endTime)) {
      throw new Error('beginTime and endTime need to provide same time, or both not provide')
    }

    const now = new Date() // 取得當前時間
    if (beginTime == undefined || endTime == undefined) {
      beginTime = new Date()
      endTime = new Date(now) // 創建一個新的 Date 物件，以當前時間為基礎
      endTime.setHours(23, 59, 59)
    }

    console.log(beginTime.toLocaleString(), endTime.toLocaleString())

    let { data: seatInfo, error: getSeatsError } = await supabase.from('seats').select('*')
    console.log(seatInfo, getSeatsError)

    let seatData: { [key: number]: model.SeatData } = {}

    if (seatInfo == null) throw new Error('找不到座位')

    seatInfo.forEach((seat: any) => {
      seatData[seat.id] = {
        id: seat.id,
        available: seat.available,
        status: seat.available ? 'available' : 'unavailable', // 初始化狀態
        otherInfo: seat.other_info
      }
    })

    let { data: reservationsData, error: getActiveReservationError } = await supabase
      .from('active_seat_reservations')
      .select('*')
      .gte('begin_time', beginTime.toLocaleString())
      .lt('end_time', endTime.toLocaleString())

    console.log(reservationsData, getActiveReservationError)

    reservationsData?.forEach((reservation: any) => {
      if (reservation.beginTime <= now && reservation.endTime > now) {
        seatData[reservation.seat_id].status = 'reserved'
      } else {
        seatData[reservation.seat_id].status = 'partiallyReserved'
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
   * Get the seat status, returns a seat
   * @url GET /api/seats/:id
   * @param id
   * @returns Promise<Response<SeatDetail>>
   */
  async getSeatStatus(seatID: number): Promise<model.SeatDetail> {
    const { data: active_seat_reservations, error } = await supabase.rpc(
      'get_seat_active_reservations',
      {
        seatID
      }
    )

    if (error) {
      throw new Error(error.message)
    }

    const seatDetail: model.SeatDetail = {
      id: seatID,
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
