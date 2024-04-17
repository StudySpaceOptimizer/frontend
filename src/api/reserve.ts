import type { Response } from './common'
import type * as model from './model'
import type { Reserve } from './index'
import { supabase } from '../service/supabase/supabase'

interface FilterRequest {
  begin: Date
  end: Date
}

export class SupabaseReserve implements Reserve {
  /**
   * Book a seat, return success or fail (true or false)
   * @url POST /api/seats/:
   * @param seatId
   * @param begin
   * @param end
   * @returns Promise<Response<null>>
   */
  async reserve(seatID: string, beginTime: Date, endTime: Date): Promise<model.Success> {
    let { data: authData, error: getUserError } = await supabase.auth.getUser()

    // 檢查是否成功獲取用戶資訊，或用戶是否存在
    if (getUserError || !authData.user) {
      throw new Error('Failed to get user data:' + getUserError?.message)
    }

    // 提取用戶ID
    const userID = authData.user.id

    const { data, error } = await supabase.from('reservations').insert([
      {
        begin_time: beginTime,
        end_time: endTime,
        user_id: userID,
        seat_id: seatID
      }
    ])

    if (error) {
      throw new Error(error.message)
    }
    return true
  }

  async getPersonalReservations(config: any): Promise<model.Reservation[]> {
    let { data: reservations, error } = await supabase.rpc('get_my_reservations')
    return (
      reservations?.map(
        (reservation: any): model.Reservation => ({
          id: reservation.id,
          beginTime: reservation.begin_time,
          endTime: reservation.end_time,
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
          },
          seatID: reservation.seat_id,
          checkInTime: reservation.check_in_time,
          temporaryLeaveTime: reservation.temporary_leave_time
        })
      ) || []
    )
  }

  async deleteReservation(id: string): Promise<any> {
    const { error } = await supabase.from('reservations').delete().eq('id', id)

    if (error) {
      throw new Error(error.message)
    }

    // 是否要確認成功刪除
  }

  terminateReservation(id: string): Promise<any> {
    throw new Error('Method not implemented.')
  }

  /**
   * Get the booked seats of the user, returns a list of {@link BookedSeat}.
   * Admin can get all the booked seats.
   * @url GET /api/user/seats?begin=begin&end=end
   * @param begin
   * @param end
   * @returns Promise<Response<BookedSeat[]>>
   */
  getPersonalBookedSeats(config?: FilterRequest): Promise<Response<model.Reservation[]>> {
    throw new Error('Method not implemented.')
  }

  /**
   * Delete the booked seat of the user, return success or fail (true or false)
   * @url DELETE /api/user/seats/:id
   * @param id
   * @returns Promise<Response<null>>
   */
  deleteBookedSeat(id: string): Promise<Response<null>> {
    throw new Error('Method not implemented.')
  }

  /**
   * User early terminate the seat, return success or fail (true or false)
   * @param id
   * @returns Promise<Response<null>>
   */
  earlyTerminateBookedSeat(id: string): Promise<Response<null>> {
    throw new Error('Method not implemented.')
  }

  /**
   * Get reservation configuration, assumed to return a generic object for now
   * @returns Promise<Response<any>>
   */
  getReserveConfiguration(): Promise<Response<any>> {
    throw new Error('Method not implemented.')
  }

  /**
   * Update reservation configuration, accepting a generic object as configuration
   * @param config
   * @returns Promise<Response<any>>
   */
  updateReserveConfiguration(config: any): Promise<Response<any>> {
    throw new Error('Method not implemented.')
  }
}
