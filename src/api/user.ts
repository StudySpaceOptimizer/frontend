import type * as Type from '../types'
import { supabase } from '../service/supabase/supabase'
import type { User } from './index'

export class SupabaseUser implements User {
  /**
   * 使用郵件地址和密碼進行用戶登入，登入成功後將 Token 存儲在 Cookie 中
   * @url POST /api/signin
   * @param email 用戶的郵件地址
   * @param password 用戶的密碼
   * @returns 無返回值，登入失敗將拋出錯誤
   */
  async signIn(email: string, password: string): Promise<string> {
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })

    if (error) {
      switch (error.status) {
        case 400:
          throw new Error('登入失敗，郵件信箱或密碼不正確')
        default:
          console.log(error.message)
          throw new Error('遇到未知錯誤，請稍後再試')
      }
    }

    const {
      data: { user },
      error: getUserError
    } = await supabase.auth.getUser()

    if (getUserError || !user) {
      throw new Error(getUserError?.message)
    }

    return user.id
  }

  /**
   * 登出當前用戶，失敗將拋出錯誤
   * @url POST /api/signout
   * @returns 無返回值
   */
  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw new Error(error.message)
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
   * 學生用戶註冊，必須使用學校郵箱註冊，成功後將 Token 存儲在 Cookie 中
   * @url POST /api/signup
   * @param email 用戶的學校郵件地址
   * @param password 用戶的密碼
   * @returns 無返回值，註冊失敗將拋出錯誤
   */
  async studentSignUp(email: string, password: string): Promise<void> {
    console.log(`email: ${email}, password: ${password}`)
    if (email.split('@')[1] !== 'mail.ntou.edu.tw') {
      throw new Error('請使用學校信箱註冊')
    }

    const { error } = await supabase.auth.signUp({
      email: email,
      password: password
    })

    if (error) {
      switch (error.status) {
        case 422:
          throw new Error('密碼應至少包含 6 個字元')
        default:
          console.log(error.message)
          throw new Error('遇到未知錯誤，請稍後再試')
      }
    }
  }

  /**
   * 使用郵箱註冊外部用戶，註冊成功後會在 Cookie 中存儲一個 token
   * @url POST /api/signup
   * @param email 用戶的郵件地址
   * @param password 用戶的密碼
   * @returns 返回操作成功的結果
   */
  async outsiderSignUp(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signUp({
      email: email,
      password: password
    })

    if (error) {
      switch (error.status) {
        case 422:
          throw new Error('密碼應至少包含 6 個字元')
        default:
          console.log(error.message)
          throw new Error('遇到未知錯誤，請稍後再試')
      }
    }
  }

  /**
   * 獲取所有用戶資料，只有管理員有權限調用此接口
   * @url GET /api/users?all=[Boolean]
   * @param getAllUser 是否獲取所有用戶
   * @returns 返回用戶數據列表
   */
  async getUsers(config: any, userId?: string): Promise<Type.UserData[]> {
    const { data: userProfiles, error } = await supabase.rpc('get_user_data', {
      p_user_id: userId
    })

    if (error) {
      throw new Error(error.message)
    }

    return (
      userProfiles?.map(
        (profile: any): Type.UserData => ({
          id: profile.id,
          email: profile.email,
          userRole: profile.user_role,
          adminRole: profile.admin_role,
          isIn: profile.is_in,
          name: profile.name,
          phone: profile.phone,
          idCard: profile.id_card,
          point: profile.point,
          ban: profile.blacklist
            ? {
                reason: profile.blacklist[0].reason,
                endAt: new Date(profile.blacklist[0].end_at)
              }
            : undefined
        })
      ) || []
    )
  }

  async getMyUser(userId: string): Promise<Type.UserData> {
    const data = await this.getUsers({}, userId)
    return data[0]
  }

  async updateUserPassword(password: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password: password })

    if (error) {
      throw new Error('請重新檢查密碼')
    }
  }

  /**
   * 更新用戶個人資料
   * @param id
   * @param name
   * @param phone
   * @param idCard
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
      throw new Error(error.message)
    }
  }

  /**
   * 禁止用戶訪問，只有管理員能使用此功能
   * @url POST /api/user/:id/ban
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
      throw new Error(error.message)
    }
  }

  /**
   * 解禁用戶，只有管理員有權限執行此操作
   * @url DELETE /api/user/:id/ban
   * @param id 要解禁的用戶ID
   * @returns 無返回值，操作失敗將拋出錯誤
   */
  async unbanUser(id: string): Promise<void> {
    const { error } = await supabase.from('active_blacklist').delete().eq('user_id', id)

    if (error) {
      throw new Error(error.message)
    }
  }

  /**
   * 為用戶增加違規點數
   * @param id 用戶ID
   * @param point 要增加的積分數
   * @returns 無返回值，操作失敗將拋出錯誤
   */
  async addPointUser(id: string, point: number): Promise<void> {
    const { data, error: getError } = await supabase
      .from('user_profiles')
      .select('point')
      .eq('id', id)
      .single()

    if (getError) {
      throw new Error(`取得用戶點數時發生錯誤: ${getError.message}`)
    }

    if (!data) {
      throw new Error('找不到用戶資料')
    }

    // 計算新的點數
    const newPoint = data.point + point

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ point: newPoint })
      .eq('id', id)

    if (updateError) {
      throw new Error(updateError.message)
    }
  }

  async updateSettings(newSettings: Type.SettingsData): Promise<void> {
    for (const key in newSettings) {
      const value = JSON.stringify(newSettings[key as keyof Type.SettingsData])
      const { error } = await supabase
        .from('settings')
        .update({ value: camelToSnakeCase(value) })
        .eq('key_name', camelToSnakeCase(key))

      if (error) {
        throw new Error(error.message)
      }
    }
  }

  async grantAdminRole(userID: String, adminRole: Type.adminRole): Promise<void> {
    const { error } = await supabase.rpc('set_claim', {
      claim: 'admin_role',
      uid: userID,
      value: adminRole
    })

    if (error) throw new Error(error.message)
  }

  async getSettings(): Promise<Type.SettingsData> {
    const { data, error } = await supabase.from('settings').select('*')

    if (error) throw new Error(error.message)

    const settings: Partial<Type.SettingsData> = {}

    data?.forEach((item: any) => {
      switch (item.key_name) {
        case 'weekday_opening_hours':
          settings.weekdayOpeningHours = JSON.parse(item.value)
          break
        case 'weekend_opening_hours':
          settings.weekendOpeningHours = JSON.parse(item.value)
          break
        case 'minimum_reservation_duration':
          settings.minimumReservationDuration = parseFloat(item.value)
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
        default:
          throw new Error('設定名稱不匹配')
      }
    })

    return settings as Type.SettingsData
  }
}

function camelToSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}
