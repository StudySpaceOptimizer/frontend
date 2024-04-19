import { supabase } from '@/service/supabase/supabase'

import type { User } from './index'
import type * as model from './model'

export class SupabaseUser implements User {
  /**
   * Sign in user with username and password, returns a token stored in cookie
   * @url POST /api/signin
   * @param email
   * @param password
   * @returns Promise<Response<Sign>>
   */
  async signIn(email: string, password: string): Promise<void> {
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
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw new Error(error.message)
    }
  }

  async checkIsSignIn(): Promise<boolean> {
    const { data } = await supabase.auth.getSession()
    console.log(data)
    return data.session != null
  }

  /**
   * Sign up student user with username and password, returns a token stored in cookie
   * @url POST /api/signup
   * @param name
   * @param username
   * @param password
   * @returns Promise<Response<Sign>>
   * @error username already exists
   */
  async studentSignUp(name: string, email: string, password: string): Promise<model.Success> {
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

    //update user profile
    throw new Error('Method not implemented.')
  }

  /**
   * Sign up outside user with email (username) and idcard, returns a token stored in cookie
   * @url POST /api/signup
   * @param name
   * @param phone
   * @param idcard
   * @param email
   * @returns Promise<Response<Sign>>
   */
  outsiderSignUp(
    name: string,
    phone: string,
    idcard: string,
    email: string
  ): Promise<model.Success> {
    throw new Error('Method not implemented.')
  }

  /**
   * Get all users, only admin can use this
   * @url GET /api/users?all=[Boolean]
   * @returns Promise<Response<UserData[]>>
   */
  async getUsers(getAllUser: boolean): Promise<model.UserData[]> {
    if (getAllUser == false) {
      const { data: userProfiles, error } = await supabase.rpc('get_my_user_data')

      if (error) {
        throw new Error(error.message)
      }

      return userProfiles?.map(
        (profile: any): model.UserData => ({
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
      )
    }

    const { data: userProfiles, error } = await supabase.rpc('get_user_datas')

    if (error) {
      throw new Error(error.message)
    }

    return (
      userProfiles?.map(
        (profile: any): model.UserData => ({
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

  async updateProfile(data: any): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      .update([
        {
          name: data.name,
          phone: data.phone,
          id_card: data.idcard
        }
      ])
      .eq('id', data.id)

    if (error) {
      throw new Error(error.message)
    }
  }

  /**
   * Ban a user, only admin can use this
   * @url POST /api/user/:id/ban
   * @param id
   * @param reason
   * @param end_at
   * @returns Promise<Response<sucess>>
   */
  async banUser(id: string, reason: string, endAt: Date): Promise<model.Success> {
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
    return true
  }

  /**
   * Unban a user, only admin can use this
   * @url DELETE /api/user/:id/ban
   * @param id
   * @returns Promise<Response<sucess>>
   */
  async unbanUser(id: string): Promise<model.Success> {
    const { error } = await supabase.from('active_blacklist').delete().eq('user_id', id)

    if (error) {
      throw new Error(error.message)
    }
    return true
  }

  /**
   * Add points to a user
   * @param id
   * @param point
   * @returns Promise<Response<sucess>>
   */
  async addPointUser(id: string, point: number): Promise<model.Success> {
    // TODO:get point
    const { error } = await supabase.from('user_profiles').update({ point: point }).eq('id', id)

    if (error) {
      throw new Error(error.message)
    }
    return true
  }

  async updateSettings(newSettings: model.SettingsData): Promise<model.Success> {
    for (const key in newSettings) {
      const value = JSON.stringify(newSettings[key as keyof model.SettingsData])
      const { error } = await supabase
        .from('settings')
        .update({ value: camelToSnakeCase(value) })
        .eq('key_name', camelToSnakeCase(key))

      if (error) {
        throw new Error(error.message)
      }
    }

    return true
  }

  async grantAdminRole(userID: String, adminRole: model.adminRole): Promise<model.Success> {
    const { error } = await supabase.rpc('set_claim', {
      claim: 'admin_role',
      uid: userID,
      value: adminRole
    })

    if (error) throw new Error(error.message)

    return true
  }

  async getSettings(): Promise<model.SettingsData> {
    let { data, error } = await supabase.from('settings').select('*')

    if (error) throw new Error(error.message)

    let settings: Partial<model.SettingsData> = {}

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

    return settings as model.SettingsData
  }
}

function camelToSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

function snakeToCamelCase(str: string): string {
  return str.replace(/(_\w)/g, (match) => match[1].toUpperCase())
}
