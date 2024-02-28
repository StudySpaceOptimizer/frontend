import type { Response } from './common'
import type { User } from './user'

/**
 * Book a seat, return success or fail (true or false)
 * 
 * @url POST /api/seats/:id
 * @param id
 * @param begin
 * @param end
 * @returns Boolean
 */
export const bookSeat = (id: string, begin: Date, end: Date): Promise<Response<null>> => {
  throw new Error('Not implemented')
}

interface BookedSeat {
  id: string
  begin: Date
  end: Date
  user: User
}

/**
 * Get the booked seats of the user, returns a list of {@link BookedSeat}. \
 * Admin can get all the booked seats.
 * 
 * @url GET /api/user/seats?begin=begin&end=end
 * @param begin 
 * @param end 
 */
export const personalBookedSeats = (begin: Date, end: Date): Promise<Response<BookedSeat[]>> => {
  throw new Error('Not implemented')
}

/**
 * Delete the booked seat of the user, return success or fail (true or false)
 * 
 * @url DELETE /api/user/seats/:id
 * @param id
 */
export const deleteBookedSeat = (id: string): Promise<Response<null>> => {
  throw new Error('Not implemented')
}

/**
 * User early terminate the seat, return success or fail (true or false)
 * 
 * @param id 
 */
export const earlyTerminateBookedSeat = (id: string): Promise<Response<null>> => {
  throw new Error('Not implemented')
}

export const getReserveConfiguration = (): Promise<Response<any>> => {
  throw new Error('Not implemented')
}

export const updateReserveConfiguration = (config: any): Promise<Response<any>> => {
  throw new Error('Not implemented')
}