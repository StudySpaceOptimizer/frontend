import type { UserData } from './user'

/**
 * This file contains all the api calls to the backend
 */
export interface SeatData {
  id: string
  available: boolean

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
  id: string
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
