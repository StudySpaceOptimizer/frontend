import type { Response } from './common'
import type * as model from './model'
import type { Reserve } from './index'

interface FilterRequest {
  begin: Date
  end: Date
}

export class SupabaseReserve implements Reserve {
  /**
   * Book a seat, return success or fail (true or false)
   * @url POST /api/seats/:
   * @param seatId
   * @param begin
   * @param end
   * @returns Promise<Response<null>>
   */
  reserve(seatId: string, begin: Date, end: Date): Promise<Response<null>> {
    

    throw new Error('Method not implemented.')
  }
  getPersonalReservations(config: any): Promise<any> {
    throw new Error('Method not implemented.')
  }
  deleteReservation(id: string): Promise<any> {
    throw new Error('Method not implemented.')
  }
  terminateReservation(id: string): Promise<any> {
    throw new Error('Method not implemented.')
  }

  /**
   * Get the booked seats of the user, returns a list of {@link BookedSeat}.
   * Admin can get all the booked seats.
   * @url GET /api/user/seats?begin=begin&end=end
   * @param begin
   * @param end
   * @returns Promise<Response<BookedSeat[]>>
   */
  getPersonalBookedSeats(config?: FilterRequest): Promise<Response<model.Reservation[]>> {
    throw new Error('Method not implemented.')
  }

  /**
   * Delete the booked seat of the user, return success or fail (true or false)
   * @url DELETE /api/user/seats/:id
   * @param id
   * @returns Promise<Response<null>>
   */
  deleteBookedSeat(id: string): Promise<Response<null>> {
    throw new Error('Method not implemented.')
  }

  /**
   * User early terminate the seat, return success or fail (true or false)
   * @param id
   * @returns Promise<Response<null>>
   */
  earlyTerminateBookedSeat(id: string): Promise<Response<null>> {
    throw new Error('Method not implemented.')
  }

  /**
   * Get reservation configuration, assumed to return a generic object for now
   * @returns Promise<Response<any>>
   */
  getReserveConfiguration(): Promise<Response<any>> {
    throw new Error('Method not implemented.')
  }

  /**
   * Update reservation configuration, accepting a generic object as configuration
   * @param config
   * @returns Promise<Response<any>>
   */
  updateReserveConfiguration(config: any): Promise<Response<any>> {
    throw new Error('Method not implemented.')
  }
}
