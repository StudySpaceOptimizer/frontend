import type { Response } from './common'
import type { User } from './index'
import { supabase } from '../service/supabase/supabase'
import type * as model from './model'

type Sign = string
type Success = Boolean

export class SupabaseUser implements User {
  /**
   * Sign in user with username and password, returns a token stored in cookie
   * @url POST /api/signin
   * @param email
   * @param password
   * @returns Promise<Response<Sign>>
   */
  async signIn(email: string, password: string): Promise<Success> {
    const { data, error } = await supabase.auth.signInWithPassword({
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

    return true
    // throw new Error('Method not implemented.')
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
  async studentSignUp(name: string, email: string, password: string): Promise<Success> {
    let { data, error } = await supabase.auth.signUp({
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
  ): Promise<Response<Sign>> {
    throw new Error('Method not implemented.')
  }

  /**
   * Get all users, only admin can use this
   * @url GET /api/users?all=[Boolean]
   * @returns Promise<Response<UserData[]>>
   */
  async getUsers(): Promise<model.UserData[]> {
    let { data: user_profiles, error } = await supabase.rpc('get_user_profiles')

    if (error) {
      throw new Error(error.message)
    }

    return (
      user_profiles?.map((profile: any) => ({
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
              end: new Date(profile.blacklist[0].end_at)
            }
          : undefined
      })) || []
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
  async banUser(id: string, reason: string, end_at: Date): Promise<Success> {
    const { data, error } = await supabase.from('blacklist').insert([
      {
        user_id: id,
        reason: reason,
        end_at: end_at
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
  async unbanUser(id: string): Promise<Success> {
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
  async addPointUser(id: string, point: number): Promise<Success> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ point: point })
      .eq('id', id)

    if (error) {
      throw new Error(error.message)
    }
    return true
  }

  updateSettings(newSettings: model.SettingsData): Promise<Response<Success>> {
    throw new Error('Method not implemented.')
  }
}
