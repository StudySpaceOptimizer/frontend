import type { Response } from './common'
import type { User } from './index'

type Sign = string;
type Success = Boolean;

export interface UserData {
  id: string
  email: string
  role: 'student' | 'outsider' | 'admin' | 'assistant'
  name: string
  phone?: string
  idCard?: string
  point: number
  ban?: {
    reason: string
    end: Date
  }
}

export class PouchDbUser implements User {
  /**
   * Sign in user with username and password, returns a token stored in cookie
   * @url POST /api/signin
   * @param username
   * @param password
   * @returns Promise<Response<Sign>>
   */
  signIn(username: string, password: string): Promise<Response<Sign>> {
    throw new Error('Method not implemented.')
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
  studentSignUp(name: string, username: string, password: string): Promise<Response<Sign>> {
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
  outsiderSignUp(name: string, phone: string, idcard: string, email: string): Promise<Response<Sign>> {
    throw new Error('Method not implemented.')
  }

  /**
   * Send verification email to the user
   * @url POST /api/sendVerificationEmail
   * @param email 
   * @returns Promise<Response<sucess>>
   */
  sendVerificationEmail(email: string): Promise<Response<Success>> {
    throw new Error('Method not implemented.')
  }

  /**
   * Get all users, only admin can use this
   * @url GET /api/users?all=[Boolean]
   * @returns Promise<Response<UserData[]>>
   */
  getUsers(): Promise<Response<UserData[]>> {
    throw new Error('Method not implemented.')
  }

  /**
   * Ban a user, only admin can use this
   * @url POST /api/user/:id/ban
   * @param id
   * @param reason
   * @param end
   * @returns Promise<Response<sucess>>
   */
  banUser(id: string, reason: string, end: Date): Promise<Response<Success>> {
    throw new Error('Method not implemented.')
  }

  /**
   * Unban a user, only admin can use this
   * @url DELETE /api/user/:id/ban
   * @param id
   * @returns Promise<Response<sucess>>
   */
  unbanUser(id: string): Promise<Response<Success>> {
    throw new Error('Method not implemented.')
  }

  /**
   * Add points to a user
   * @param id
   * @param point
   * @returns Promise<Response<sucess>>
   */
  addPointUser(id: string, point: number): Promise<Response<Success>> {
    throw new Error('Method not implemented.')
  }
}
