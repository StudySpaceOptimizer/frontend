import type * as Type from '../types'
import { supabase } from '../service/supabase/supabase'
import { seatConverterToDB, seatConverterFromDB } from '../utils'

import type { Reserve, Config } from './index'

export class SupabaseReserve implements Reserve {
  /**
   * 預約座位，若座位已被預約或發生其他錯誤，將拋出錯誤
   * @url POST /api/seats/
   * @param seatID 座位ID
   * @param beginTime 預約開始時間
   * @param endTime 預約結束時間
   * @returns 無返回值，操作失敗將拋出錯誤
   */
  async reserve(seatID: string, beginTime: Date, endTime: Date): Promise<void> {
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
  }

  async getPersonalReservations(config: Config): Promise<Type.Reservation[]> {
    let { pageSize, pageOffset } = config
    const { data: reservations } = await supabase.rpc('get_my_reservations', {
      page_size: pageSize,
      page_offset: pageOffset
    })

    return (
      reservations?.map(
        (reservation: any): Type.Reservation => ({
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

  /**
   * 删除指定的预约记录
   * @param id 預約記錄的ID
   * @returns 無回傳值，操作失敗將拋出錯誤
   */
  async deleteReservation(id: string): Promise<void> {
    const { error } = await supabase.from('reservations').delete().eq('id', id)

    if (error) {
      throw new Error(error.message)
    }

    const { data } = await supabase.from('reservations').select('*').eq('id', id)

    if (data?.length != 0) {
      throw new Error('刪除預約失敗')
    }
  }

  /**
   * 終止指定的預約
   * @param id 預約記錄的ID
   * @returns 無回傳值，操作失敗將拋出錯誤
   */
  async terminateReservation(id: string): Promise<void> {
    // const seatId = seatConverterToDB(id)
    const { error } = await supabase
      .from('reservations')
      .update({ end_time: new Date() })
      .eq('id', id)
      .select()

    if (error) {
      throw new Error(error.message)
    }
  }
}
