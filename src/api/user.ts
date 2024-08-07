import type * as Types from '../types'
import { supabase } from '../service/supabase/supabase'
import type { User } from './index'
import { errorHandler } from './common'

export class SupabaseUser implements User {
  async verifyWithPOP3(email: string, password: string): Promise<string> {
    const res = await fetch(
      '/authenticate',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      }
    )

    if (!res.ok) {
      console.log(res)
      throw new Error(errorHandler('default'))
    }

    console.log(res)
    const data = await res.json()

    return data.password
  }

  /**
   * 學生使用郵件地址和密碼進行用戶登入，登入成功後將 Token 存儲在 Cookie 中
   * @param email 學號
   * @param password 用戶的密碼
   * @returns 無返回值，登入失敗將拋出錯誤
   */
  async studentSignIn(email: string, password: string): Promise<string> {
    const logInPassword = await this.verifyWithPOP3(email, password)

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: logInPassword
    })

    if (signInError) {
      if (signInError.status == 400) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email,
          password: logInPassword
        })

        if (signUpError) {
          console.log(signUpError)
          throw new Error(errorHandler(signUpError.message))
        }

        if (!signUpData.user || !signUpData.user.id) {
          throw new Error(errorHandler('default'))
        }

        return signUpData.user.id
      } else {
        console.log(signInError)
        throw new Error(errorHandler(signInError.message))
      }
    }

    if (!signInData.user || !signInData.user.id) {
      throw new Error(errorHandler('default'))
    }
    return signInData.user.id
  }

  /**
   * 登出當前用戶，失敗將拋出錯誤
   * @returns 操作無返回值，失敗將拋出錯誤
   */
  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.log(error)
      throw new Error(errorHandler(error.message))
    }
  }

  /**
   * 檢查用戶是否已經登入
   * @returns 返回一個布林值，表示用戶是否已經登入
   */
  async checkIsSignIn(): Promise<boolean> {
    const { data } = await supabase.auth.getSession()
    return data.session != null
  }

  /**
   * 插入校外人士註冊請求
   * @param name 用戶的名稱
   * @param phone 用戶的手機
   * @param idCard 用戶的身分證
   * @param email 用戶的郵件地址
   * @returns 無返回值，操作失敗將拋出錯誤
   */
  async insertOutsiderSignUpRequest(
    name: string,
    phone: string,
    idCard: string,
    email: string
  ): Promise<void> {
    const { error } = await supabase.from('outsider_sign_up_request').insert([
      {
        email: email,
        name: name,
        phone: phone,
        id_card: idCard
      }
    ])

    if (error) {
      console.log(error)
      throw new Error(errorHandler(error.code))
    }
  }

  /**
   * 管理員註冊校外人士帳號
   * @param name 用戶的名稱
   * @param phone 用戶的手機
   * @param idCard 用戶的身分證
   * @param email 用戶的郵件地址
   * @returns 無返回值，操作失敗將拋出錯誤
   */
  async outsiderSignUp(name: string, phone: string, idCard: string, email: string): Promise<void> {
    const { error: checkError } = await supabase.rpc('check_insert_user_profile', {
      _phone: phone,
      _id_card: idCard,
      _email: email
    })

    if (checkError) {
      console.log(checkError)
      throw new Error(errorHandler(checkError.code))
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email,
      password: idCard
    })

    if (signUpError) {
      console.log(signUpError)
      throw new Error(errorHandler(signUpError.message))
    }

    if (!signUpData.user || !signUpData.user.id) {
      throw new Error(errorHandler('default'))
    }

    const user_id = signUpData.user.id

    await this.updateProfile(user_id, name, phone, idCard)
  }

  /**
   * 根據過濾條件獲取校外人士註冊請求資料
   * @param pageFilter 包含分頁配置
   * @param OutsiderSignUpDataFilter 包含用戶的過濾條件
   * @returns 校外人士註冊請求資料列表
   */
  async getOutsiderSignUpData(
    options: Types.PageFilter & Types.OutsiderSignUpDataFilter = {}
  ): Promise<Types.OutsiderSignUpData[]> {
    const { pageSize, pageOffset, email, name, phone, idCard } = options

    const { data: outsiderSignUpRequests, error } = await supabase.rpc(
      'get_outsider_sign_up_data',
      {
        page_size: pageSize,
        page_offset: pageOffset,
        filter_email: email,
        filter_name: name,
        filter_phone: phone,
        filter_idCard: idCard
      }
    )

    if (error) {
      console.log(error)
      throw new Error(errorHandler(error.code))
    }

    return (
      outsiderSignUpRequests?.map(
        (request: any): Types.OutsiderSignUpData => ({
          email: request.email,
          name: request.name,
          phone: request.phone,
          idCard: request.id_card
        })
      ) || []
    )
  }

  /**
   * 根據過濾條件獲取用戶資料一般使用者使用此 API 只會返回自己的用戶資料
   * @param pageFilter 包含分頁配置
   * @param userDataFilter 包含用戶的過濾條件
   * @returns 返回用戶數據列表
   */
  async getUserData(
    options: Types.PageFilter & Types.UserDataFilter = {}
  ): Promise<Types.UserData[]> {
    const { pageSize, pageOffset, userId, email, userRole, adminRole, isIn, name } = options

    const { data: userProfiles, error } = await supabase.rpc('get_user_data', {
      page_size: pageSize,
      page_offset: pageOffset,
      filter_user_id: userId,
      filter_email: email,
      filter_user_role: userRole,
      filter_admin_role: adminRole,
      filter_is_in: isIn,
      filter_name: name
    })

    if (error) {
      console.log(error)
      throw new Error(errorHandler(error.code))
    }

    return (
      userProfiles?.map(
        (profile: any): Types.UserData => ({
          id: profile.id,
          email: profile.email,
          userRole: profile.user_role,
          adminRole: profile.admin_role,
          isIn: profile.is_in,
          name: profile.name,
          phone: profile.phone,
          idCard: profile.id_card,
          point: profile.point,
          ban: profile.reason
            ? {
                reason: profile.reason,
                endAt: new Date(profile.end_at)
              }
            : undefined
        })
      ) || []
    )
  }

  async getMyUserData(): Promise<Types.UserData> {
    const {
      data: { user },
      error: getUserError
    } = await supabase.auth.getUser()

    if (getUserError) {
      console.log(getUserError)
      throw new Error(errorHandler(getUserError.message))
    }
    if (!user) {
      throw new Error(errorHandler('user_not_found'))
    }

    const { data: userProfiles, error: getUserDataError } = await supabase.rpc('get_user_data', {
      page_size: undefined,
      page_offset: undefined,
      filter_user_id: user.id,
      filter_email: undefined,
      filter_user_role: undefined,
      filter_admin_role: undefined,
      filter_is_in: undefined,
      filter_name: undefined
    })

    if (getUserDataError) {
      console.log(getUserDataError)
      throw new Error(errorHandler(getUserDataError.code))
    }

    const userProfile = userProfiles?.[0]
    if (!userProfile) {
      throw new Error(errorHandler('user01'))
    }

    return {
      id: userProfile.id,
      email: userProfile.email,
      userRole: userProfile.user_role,
      adminRole: userProfile.admin_role,
      isIn: userProfile.is_in,
      name: userProfile.name,
      phone: userProfile.phone,
      idCard: userProfile.id_card,
      point: userProfile.point,
      ban: userProfile.reason
        ? {
            reason: userProfile.reason,
            endAt: new Date(userProfile.end_at)
          }
        : undefined
    }
  }

  /**
   * 獲取目前註冊的所有用戶的總數。這個 API 用於管理員儀表板，以顯示用戶總數
   * @returns 返回用戶總數，如果發生錯誤，將拋出異常
   */
  async getUsersCount(): Promise<number> {
    const { data, error } = await supabase.from('user_profiles').select('count', { count: 'exact' })

    if (error) {
      console.log(error)
      throw new Error(errorHandler(error.code))
    }

    return data?.at(0)?.count || 0
  }

  /**
   * 更新用戶個人資料，只有管理員可以更新
   * @param id 用戶ID
   * @param name 名稱
   * @param phone 手機
   * @param idCard 身分證
   * @returns 無返回值，操作失敗將拋出錯誤
   */
  async updateProfile(id: string, name: string, phone: string, idCard: string): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      .update([
        {
          name: name,
          phone: phone,
          id_card: idCard
        }
      ])
      .eq('id', id)

    if (error) {
      console.log(error)
      throw new Error(errorHandler(error.code))
    }
  }

  /**
   * 禁止用戶訪問，只有管理員能使用此功能
   * @param id 被禁用的用戶ID
   * @param reason 禁用的原因
   * @param end_at 禁用結束的時間
   * @returns 無返回值，操作失敗將拋出錯誤
   */
  async banUser(id: string, reason: string, endAt: Date): Promise<void> {
    const { error } = await supabase.from('blacklist').insert([
      {
        user_id: id,
        reason: reason,
        end_at: endAt
      }
    ])

    if (error) {
      console.log(error)
      throw new Error(errorHandler(error.code))
    }
  }

  /**
   * 解禁用戶，只有管理員有權限執行此操作
   * @param id 要解禁的用戶ID
   * @returns 無返回值，操作失敗將拋出錯誤
   */
  async unbanUser(id: string): Promise<void> {
    const { error } = await supabase.from('active_blacklist').delete().eq('user_id', id)

    if (error) {
      console.log(error)
      throw new Error(errorHandler(error.code))
    }
  }

  /**
   * 為用戶增加違規點數
   * @param id 用戶ID
   * @param point 要增加的積分數
   * @returns 無返回值，操作失敗將拋出錯誤
   */
  async updatePointUser(id: string, point: number): Promise<void> {
    const { error } = await supabase.from('user_profiles').update({ point: point }).eq('id', id)

    if (error) {
      console.log(error)
      throw new Error(errorHandler(error.code))
    }
  }

  /**
   * 獲取系統設置資料
   * @returns 返回系統設置數據
   */
  async getSettings(): Promise<Types.SettingsData> {
    const { data, error } = await supabase.from('settings').select('*')

    if (error) {
      console.log(error)
      throw new Error(errorHandler(error.code))
    }

    const settings: Partial<Types.SettingsData> = {}

    data?.forEach((item) => {
      let parsedValue: any
      switch (item.key_name) {
        case 'weekday_opening_hours':
          parsedValue = JSON.parse(item.value)
          settings.weekdayOpeningHours = {
            beginTime: parsedValue.begin_time,
            endTime: parsedValue.end_time
          }
          break
        case 'weekend_opening_hours':
          parsedValue = JSON.parse(item.value)
          settings.weekendOpeningHours = {
            beginTime: parsedValue.begin_time,
            endTime: parsedValue.end_time
          }
          break
        case 'maximum_reservation_duration':
          settings.maximumReservationDuration = parseInt(item.value, 10)
          break
        case 'student_reservation_limit':
          settings.studentReservationLimit = parseInt(item.value, 10)
          break
        case 'outsider_reservation_limit':
          settings.outsiderReservationLimit = parseInt(item.value, 10)
          break
        case 'points_to_ban_user':
          settings.pointsToBanUser = parseInt(item.value, 10)
          break
        case 'checkin_deadline_minutes':
          settings.checkin_deadline_minutes = parseInt(item.value, 10)
          break
        case 'temporary_leave_deadline_minutes':
          settings.temporary_leave_deadline_minutes = parseInt(item.value, 10)
          break
        case 'check_in_violation_points':
          settings.check_in_violation_points = parseInt(item.value, 10)
          break
        case 'reservation_time_unit':
          settings.reservation_time_unit = parseInt(item.value, 10)
          break
        default:
          throw new Error(errorHandler('default'))
      }
    })

    return settings as Types.SettingsData
  }

  /**
   * 更新系統設置
   * @param newSettings 新的設置數據
   * @returns 操作無返回值，失敗將拋出錯誤
   */
  async updateSettings(newSettings: Types.SettingsData): Promise<void> {
    for (const key in newSettings) {
      const value = JSON.stringify(newSettings[key as keyof Types.SettingsData])

      const { error } = await supabase
        .from('settings')
        .update({ value: camelToSnakeCase(value) })
        .eq('key_name', camelToSnakeCase(key))

      if (error) {
        console.log(error)
        throw new Error(errorHandler(error.code))
      }
    }
  }

  /**
   * 給用戶分配管理角色
   * @param userId 用戶ID
   * @param adminRole 分配的管理角色
   * @returns 操作無返回值，失敗將拋出錯誤
   */
  async grantAdminRole(userId: string, adminRole: Types.adminRole): Promise<void> {
    const { error } = await supabase.rpc('set_claim', {
      claim: 'admin_role',
      uid: userId,
      value: adminRole
    })

    if (error) {
      console.log(error)
      throw new Error(errorHandler(error.code))
    }
  }
}

function camelToSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}
