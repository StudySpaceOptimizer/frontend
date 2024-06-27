import type * as Types from '../types'
import { supabase } from '../service/supabase/supabase'
import { seatConverterToDB, seatConverterFromDB } from '../utils'

import type { Reserve } from './index'

export class SupabaseReserve implements Reserve {
  /**
   * 預約座位，若座位已被預約或發生其他錯誤，將拋出錯誤
   * @param seatId 座位ID
   * @param beginTime 預約開始時間
   * @param endTime 預約結束時間
   * @returns 無返回值，操作失敗將拋出錯誤
   */
  async reserve(seatId: string, beginTime: Date, endTime: Date): Promise<string> {
    const { data: authData, error: getUserError } = await supabase.auth.getUser()

    // 檢查是否成功獲取用戶資訊，或用戶是否存在
    if (getUserError || !authData.user) {
      throw new Error('Failed to get user data:' + getUserError?.message)
    }

    const seatIdNumber = seatConverterToDB(seatId)
    // 提取用戶ID
    const userID = authData.user.id

    const { data, error } = await supabase
      .from('reservations')
      .insert([
        {
          begin_time: beginTime,
          end_time: endTime,
          user_id: userID,
          seat_id: seatIdNumber
        }
      ])
      .select()

    if (error) {
      switch (error.code) {
        case '42501':
          throw new Error('權限不足')
        default:
          console.error(error.message)
          throw new Error('遇到未知錯誤，請稍後再試')
      }
    } else {
      console.log(data)
      return data[0].id
    }
  }

  /**
   * 為指定的用戶預約座位，若座位已被預約或發生其他錯誤，將拋出錯誤
   * @param idCard 用戶的身份證號碼
   * @param seatId 座位ID
   * @param beginTime 預約開始時間
   * @param endTime 預約結束時間
   * @returns 操作成功返回預約ID，失敗則拋出錯誤
   */
  async reserveForUser(
    idCard: string,
    seatId: string,
    beginTime: Date,
    endTime: Date
  ): Promise<string> {
    // 根據 id_card 查找用戶
    const { data: userData, error: getUserDataError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id_card', idCard)
      .single()

    if (getUserDataError || !userData) {
      throw new Error('Failed to get user data by id_card:' + getUserDataError?.message)
    }

    const userID = userData.id

    const seatIdNumber = seatConverterToDB(seatId)

    // 插入預約
    const { data, error } = await supabase
      .from('reservations')
      .insert([
        {
          begin_time: beginTime,
          end_time: endTime,
          user_id: userID,
          seat_id: seatIdNumber
        }
      ])
      .select()

    if (error) {
      throw new Error(error.message)
    } else {
      console.log(data)
      return data[0].id
    }
  }

  /**
   * 根據過濾條件獲取預約列表，一般使用者使用此 API 只會返回自己的預約紀錄
   * @param pageFilter 包含分頁配置
   * @param reservationFilter 包含座位和用戶的過濾條件
   * @returns 返回符合條件的預約列表
   */
  async getReservations(
    options: Types.PageFilter & Types.ReservationFilter = {}
  ): Promise<Types.Reservation[]> {
    const {
      pageSize,
      pageOffset,
      userId,
      userRole,
      seatId,
      beginTimeStart,
      beginTimeEnd,
      endTimeStart,
      endTimeEnd
    } = options

    const { data: reservations, error } = await supabase.rpc('get_reservations', {
      page_size: pageSize,
      page_offset: pageOffset,
      filter_user_id: userId,
      filter_user_role: userRole,
      filter_seat_id: seatId,
      filter_begin_time_start: beginTimeStart,
      filter_begin_time_end: beginTimeEnd,
      filter_end_time_start: endTimeStart,
      filter_end_time_end: endTimeEnd
    })

    if (error) {
      throw new Error(error.message)
    }

    return (
      reservations?.map(
        (reservation: any): Types.Reservation => ({
          id: reservation.id,
          beginTime: new Date(reservation.begin_time),
          endTime: new Date(reservation.end_time),
          seatId: seatConverterFromDB(reservation.seat_id),
          checkInTime: reservation.check_in_time,
          temporaryLeaveTime: reservation.temporary_leave_time,
          user: {
            id: reservation.user_id,
            userRole: reservation.user_role,
            email: reservation.email,
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
        })
      ) || []
    )
  }

  async getMyReservations(): Promise<Types.Reservation> {
    const {
      data: { user },
      error: getUserError
    } = await supabase.auth.getUser()

    if (getUserError || !user) {
      throw new Error(getUserError?.message)
    }

    const { data: reservations, error } = await supabase.rpc('get_reservations', {
      page_size: undefined,
      page_offset: undefined,
      filter_user_id: user.id,
      filter_user_role: undefined,
      filter_seat_id: undefined,
      filter_begin_time_start: undefined,
      filter_begin_time_end: undefined,
      filter_end_time_start: undefined,
      filter_end_time_end: undefined
    })

    if (error) {
      throw new Error(error.message)
    }

    return (
      reservations?.map(
        (reservation: any): Types.Reservation => ({
          id: reservation.id,
          beginTime: new Date(reservation.begin_time),
          endTime: new Date(reservation.end_time),
          seatId: seatConverterFromDB(reservation.seat_id),
          checkInTime: reservation.check_in_time,
          temporaryLeaveTime: reservation.temporary_leave_time,
          user: {
            id: reservation.user_id,
            userRole: reservation.user_role,
            email: reservation.email,
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
        })
      ) || []
    )
  }

  /**
   * 獲取當前用戶的預約數量
   * @returns 返回當前用戶的預約數量
   */
  async getPersonalReservationsCount(): Promise<number> {
    const { data: data, error } = await supabase
      .from('reservations')
      .select('count', { count: 'exact' })
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)

    if (error) {
      throw new Error(error.message)
    }

    return data?.at(0)?.count || 0
  }

  /**
   * 獲取所有用戶的預約總數
   * @returns 返回系統中的總預約數量
   */
  async getAllReservationsCount(): Promise<number> {
    const { data: data, error } = await supabase
      .from('reservations')
      .select('count', { count: 'exact' })

    if (error) {
      throw new Error(error.message)
    }

    return data?.at(0)?.count || 0
  }

  /**
   * 刪除指定的預約記錄
   * @param id 預約記錄的ID
   * @returns 操作無回傳值，失敗將拋出錯誤
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
   * 終止指定的預約，將預約結束時間設為當前時間
   * @param id 預約記錄的ID
   * @returns 操作無回傳值，失敗將拋出錯誤
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
