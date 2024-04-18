import type * as model from './model'
import { toLocalDateTime } from './common'
import type { Seat } from './index'
import { supabase } from '../service/supabase/supabase'

interface SeatRequest {
  begin?: Date
  end?: Date
}

export class SupabaseSeat implements Seat {
  /**
   * Get all the seats, returns a list of seats
   * if begin time and end time is provided, returns the status of the seats in the range
   * @url GET /api/seats?begin=begin&end=end
   * @returns Promise<Response<SeatData[]>>
   */
  getSeatsStatus(config: SeatRequest): Promise<model.SeatData[]> {
    const { begin, end } = config
    if (Boolean(begin) !== Boolean(end)) {
      throw new Error('begin and end need to provide same time, or both not provide')
    }

    throw new Error('Method not implemented.')
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
