import type { UserData } from './user'
import type { Response } from './common'
import type { Seat } from './index'

/**
 * This file contains all the api calls to the backend
 */
interface SeatData {
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

interface SeatRequest {
  begin?: Date
  end?: Date
}

interface SeatDetail extends SeatData {
  /**
   * The booked range of the seat
   */
  bookedRange: {
    start: Date
    end: Date
    status: 'available' | 'booked' | 'unavailable'
  }[]

  /**
   * Need admin permission to get this field
   */
  user?: UserData
}

export class PouchDbSeat implements Seat {
  /**
   * Get all the seats, returns a list of seats
   * if begin time and end time is provided, returns the status of the seats in the range
   * @url GET /api/seats?begin=begin&end=end
   * @returns Promise<Response<SeatData[]>>
   */
  getSeatsStatus(config: SeatRequest): Promise<Response<SeatData[]>> {
    const { begin, end } = config
    if (Boolean(begin) !== Boolean(end)) {
      throw new Error('begin and end need to provide same time, or both not provide')
    }
    throw new Error('Method not implemented.')
  }

  /**
   * Get the seats configurations, returns a Konva Object
   * TODO: 回傳的東西還沒想好，但這個基本上後端不會動，所以先假設一個任意 Object 回傳 (座位圖還沒做完)
   * @url GET /api/seats/configurations
   * @returns Promise<Response<any>>
   */
  getSeatsConfigurations(): Promise<Response<any>> {
    throw new Error('Method not implemented.')
  }

  /**
   * Get the seat status, returns a seat
   * @url GET /api/seats/:id
   * @param id
   * @returns Promise<Response<SeatDetail>>
   */
  getSeatStatus(id: string): Promise<Response<SeatDetail>> {
    throw new Error('Method not implemented.')
  }
}