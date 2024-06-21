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
      switch (error.code) {
        case '42501':
          throw new Error('權限不足')
        default:
          console.log(error.message)
          throw new Error('遇到未知錯誤，請稍後再試')
      }
    }
  }

  /**
   * 為指定的用戶預約座位，若座位已被預約或發生其他錯誤，將拋出錯誤
   * @url POST /api/seats/
   * @param idCard 用戶的身份證號碼
   * @param seatID 座位ID
   * @param beginTime 預約開始時間
   * @param endTime 預約結束時間
   * @returns 無返回值，操作失敗將拋出錯誤
   */
  async reserveForUser(
    idCard: string,
    seatID: string,
    beginTime: Date,
    endTime: Date
  ): Promise<void> {
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

    const seatIDNumber = seatConverterToDB(seatID)

    // 插入預約
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
    const { pageSize = 10, pageOffset = 0 } = config
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

  async getAllReservations(
    config: Config,
    userID?: string,
    userRole?: string,
    seatID?: string,
    beginTimeStart?: Date,
    beginTimeEnd?: Date,
    endTimeStart?: Date,
    endTimeEnd?: Date
  ): Promise<Type.Reservation[]> {
    const { pageSize = 10, pageOffset = 0 } = config

    let query = supabase.rpc('test_get_reservations', {
      page_size: pageSize,
      page_offset: pageOffset
    })

    if (userID) query = query.eq('user_id', userID)
    if (userRole) query = query.eq('user_role', userRole)
    if (seatID) query = query.eq('seat_id', seatConverterToDB(seatID))

    /// 時間會少 8 小時
    if (beginTimeStart) query = query.gte('begin_time', beginTimeStart.toISOString())
    if (beginTimeEnd) query = query.lte('begin_time', beginTimeEnd.toISOString())
    if (endTimeStart) query = query.gte('end_time', endTimeStart.toISOString())
    if (endTimeEnd) query = query.lte('end_time', endTimeEnd.toISOString())

    const { data: reservations, error } = await query

    if (error) {
      throw new Error(error.message)
    }
    return (
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

  async getAllReservationsCount(): Promise<number> {
    const { data: data, error } = await supabase
      .from('reservations')
      .select('count', { count: 'exact' })

    if (error) {
      throw new Error(error.message)
    }

    return data?.at(0)?.count || 0
  }
}
