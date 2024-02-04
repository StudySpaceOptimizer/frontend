// The api rule is restful api, and the response is json

/**
 * This file contains all the api calls to the backend
 */
interface Response {
  status: number
  message?: string
  data?: any
}

interface signInResponse {}

/**
 * Sign in user with username and password, returns a token stored in cookie
 * @url  POST /api/signin
 * @param username
 * @param password
 * @returns usertoken
 */
export const signIn = (username: string, password: string): Promise<signInResponse> => {
  throw new Error('Not implemented')
}

interface User {
  username: string
  email?: string
  phone?: string
}

/**
 * Use token to get user information, token stored in cookie
 * @url GET /api/user
 * @param token
 * @returns user
 */
export const getUser = (): Promise<User> => {
  throw new Error('Not implemented')
}

interface signUpResponse {}

/**
 * Sign up student user with username and password, returns a token stored in cookie
 * @url  POST /api/signup
 * @param username
 * @param password
 * @returns usertoken
 * @error username already exists
 */
export const studentSignUp = (username: string, password: string): Promise<signUpResponse> => {
  throw new Error('Not implemented')
}

/**
 * Sign up outsides user with email (username) and idcard, returns a token stored in cookie
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
): Promise<signUpResponse> => {
  throw new Error('Not implemented')
}

interface Seat {
  id: string

  /**
   * The status of the seat \
   * available: the seat is available \
   * booked: the seat is booked by someone \
   * partiallyBooked: the seat is partially range time booked \
   * unavailable: the seat is unavailable
   */
  status: 'available' | 'booked' | 'partiallyBooked' | 'unavailable'
}

/**
 * Get all the seats, returns a list of seats
 * @url GET /api/seats
 * @returns list of {@link Seat}
 */
export const getSeatsStatus = (): Promise<Seat[]> => {
  throw new Error('Not implemented')
}

interface SeatDetail extends Seat {
  /**
   * The booked range of the seat
   */
  bookedRange?: {
    start: string
    end: string
    status: 'available' | 'booked' | 'unavailable'
  }[]

  /**
   * Need admin permission to get this field
   */
  user?: User
}

/**
 * Get the seat status, returns a seat
 * @url GET /api/seats/:id
 * @param id
 * @returns {@link Seat}
 */
export const getSeatStatus = (id: string): Promise<SeatDetail> => {
  throw new Error('Not implemented')
}
