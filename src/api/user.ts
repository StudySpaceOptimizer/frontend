import type { Response } from './common'

interface Sign {
  token: string
}

/**
 * Sign in user with username and password, returns a token stored in cookie
 *
 * @url  POST /api/signin
 * @param username
 * @param password
 * @returns usertoken
 */
export const signIn = (username: string, password: string): Promise<Response<Sign>> => {
  throw new Error('Not implemented')
}

/**
 * Sign up student user with username and password, returns a token stored in cookie
 *
 * @url  POST /api/signup
 * @param name
 * @param username
 * @param password
 * @returns usertoken
 * @error username already exists
 */
export const studentSignUp = (name: string, username: string, password: string): Promise<Response<Sign>> => {
  throw new Error('Not implemented')
}

/**
 * Sign up outsides user with email (username) and idcard, returns a token stored in cookie
 *
 * @url  POST /api/signup
 * @param name
 * @param phone
 * @param idcard
 * @param email
 * @returns usertoken
 */
export const outsiderSignUp = (
  name: string,
  phone: string,
  idcard: string,
  email: string
): Promise<Response<Sign>> => {
  throw new Error('Not implemented')
}

/**
 * Send verification email to the user
 * 
 * @url POST /api/sendVerificationEmail
 * @param email 
 */
export const sendVerificationEmail = (email: string): Promise<Response<Boolean>> => {
  throw new Error('Not implemented')
}

export interface User {
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

/**
 * Use token to get user information, token stored in cookie
 * Admin can get any user, user can only get themselves
 *
 * @url GET /api/user/:id
 * @param token
 * @returns user
 */
export const getUser = (): Promise<Response<User>> => {
  throw new Error('Not implemented')
}

/**
 * Get all users, only admin can use this
 *
 * @url GET /api/users?all=[Boolean]
 * @param token
 * @returns user[]
 */
export const getAllUsers = (): Promise<Response<User[]>> => {
  throw new Error('Not implemented')
}

/**
 * Ban a user, only admin can use this
 *
 * @url POST /api/user/:id/ban
 * @param id
 * @param reason
 * @param end
 * @returns Boolean
 */
export const banUser = (id: string, reason: string, end: Date): Promise<Response<Boolean>> => {
  throw new Error('Not implemented')
}

/**
 * Unban a user, only admin can use this
 *
 * @url DELETE /api/user/:id/ban
 * @param id
 * @returns Boolean
 */
export const unbanUser = (id: string): Promise<Response<Boolean>> => {
  throw new Error('Not implemented')
}

export const addPointUser = (id: string, point: number): Promise<Response<Boolean>> => {
  throw new Error('Not implemented')
}