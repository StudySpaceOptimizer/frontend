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

      return userProfiles[0]
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
    const { error } = await supabase
      .from('user_profiles')
      .update({ point: point })
      .eq('id', id)

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
}

function camelToSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

function snakeToCamelCase(str: string): string {
  return str.replace(/(_\w)/g, (match) => match[1].toUpperCase())
}
