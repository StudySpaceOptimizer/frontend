import type { UserData } from './user'

/**
 * This file contains all the api calls to the backend
 */
export interface SeatData {
  seatCode: string

  otherInfo?: string

  /**
   * The status of the seat \
   * available: the seat is available \
   * booked: the seat is booked by someone \
   * partiallyBooked: the seat is partially range time booked \
   * unavailable: the seat is unavailable
   */
  status: 'available' | 'reserved' | 'partiallyReserved' | 'unavailable'
}

export interface SeatDetail {
  seatCode: string
  /**
   * The booked range of the seat
   */
  reservations: {
    beginTime: Date
    endTime: Date

    /**
     * Need admin permission to get this field
     */
    user?: UserData
  }[]
}
