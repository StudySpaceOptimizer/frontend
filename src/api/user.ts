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
 * @param username
 * @param password
 * @returns usertoken
 * @error username already exists
 */
export const studentSignUp = (username: string, password: string): Promise<Response<Sign>> => {
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

export interface User {
  username: string
  email?: string
  phone?: string
}

/**
 * Use token to get user information, token stored in cookie
 *
 * @url GET /api/user
 * @param token
 * @returns user
 */
export const getUser = (): Promise<Response<User>> => {
  throw new Error('Not implemented')
}
