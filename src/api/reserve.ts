import type { Response } from './common'
import type * as model from './model'
import type { Reserve } from './index'
import { supabase } from '../service/supabase/supabase'

import { seatConverterToDB, seatConverterFromDB } from '@/utils'

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
    const { data: authData, error: getUserError } = await supabase.auth.getUser()

    // 檢查是否成功獲取用戶資訊，或用戶是否存在
    if (getUserError || !authData.user) {
      throw new Error('Failed to get user data:' + getUserError?.message)
    }

    const seatIDNumber = seatConverterToDB(seatID)
    // 提取用戶ID
    const userID = authData.user.id

    const { error } = await supabase.from('reservations').insert([
      {
        begin_time: beginTime,
        end_time: endTime,
        user_id: userID,
        seat_id: seatIDNumber
      }
    ])

    if (error) {
      throw new Error(error.message)
    }
    return true
  }

  async getPersonalReservations(config: any): Promise<model.Reservation[]> {
    const { data: reservations } = await supabase.rpc('get_my_reservations')
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
          seatID: seatConverterFromDB(reservation.seat_id),
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

    const { data } = await supabase.from('reservations').select('*').eq('id', id)

    if (data) throw new Error('刪除預約失敗')
  }

  async terminateReservation(id: string): Promise<any> {
    const seatId = seatConverterToDB(id)
    const { error } = await supabase
      .from('reservations')
      .update({ end_time: new Date() })
      .eq('id', seatId)
      .select()

    if (error) {
      throw new Error(error.message)
    }
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
