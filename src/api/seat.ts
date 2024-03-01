import type { User } from './user'
import type { Response } from './common'

/**
 * This file contains all the api calls to the backend
 */
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

interface SeatRequest {
  begin?: Date
  end?: Date
}

/**
 * Get all the seats, returns a list of seats
 * if begin time and end time is provided, returns the status of the seats in the range
 * 
 * @url GET /api/seats?begin=begin&end=end
 * @returns list of {@link Seat}
 */
export const getSeatsStatus = (config: SeatRequest): Promise<Response<Seat[]>> => {
  const { begin, end } = config
  if (Boolean(begin) !== Boolean(end)) {
    throw new Error('begin and end need to provide same time, or both not provide')
  }

  /*
  get NUMBER_OF_SEATS

  const now: number = Date.now(); // 獲取當前時間戳
    let seatsVec: SeatAvailability[] = [];

    try {
      const isWithinUnavailableTimeslot = await this.timeslotRepository.isWithinUnavailableTimeslot(now);

      if (isWithinUnavailableTimeslot) {
        for (let seat = 1; seat < NUMBER_OF_SEATS; seat++) {
          seatsVec.push({
            seatId: seat,
            status: 'Unavailable',
          });
        }
      } else {
        const result = await this.seatRepository.queryCurrentSeatStatuses();

        for (const [seatId, statusStr] of result) {
          let status: SeatAvailabilityStatus;
          switch (statusStr) {
            case 'Available':
              status = 'Available';
              break;
            case 'Borrowed':
              status = 'Borrowed';
              break;
            case 'Unavailable':
              status = 'Unavailable';
              break;
            default:
              throw new Error('Internal Server Error');
          }
          seatsVec.push({ seatId, status });
        }
      }

      return { seats: seatsVec };
    } catch (error) {
      throw new Error(`Error: ${error}`);
    }
  }
  */

  throw new Error('Not implemented')
}

/**
 * Get the seats configurations, returns a Konva Object
 * TODO: 回傳的東西還沒想好，但這個基本上後端不會動，所以先假設一個任意 Object 回傳 (座位圖還沒做完)
 * 
 * @url GET /api/seats/configurations
 * @returns 
 */
export const getSeatsConfigurations = (): Promise<Response<any>> => {
  throw new Error('Not implemented')
}

interface SeatDetail extends Seat {
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
  user?: User
}

/**
 * Get the seat status, returns a seat
 * 
 * @url GET /api/seats/:id
 * @param id
 * @returns {@link Seat}
 */
export const getSeatStatus = (id: string): Promise<Response<SeatDetail>> => {

  // TODO
  throw new Error('Not implemented')
}

/**
 * `Book a seat, return success or fail (true or false)`
 * 
 * @url POST /api/seats/:id
 * @param id
 * @param begin
 * @param end
 * @returns 
 */
export const bookSeat = (id: string, begin: Date, end: Date): Promise<Response<null>> => {

  /*
  if is_overlapping_with_unavailable_timeslot

  userReservations = query_user_reservations

  for (let reservation of userReservations) {
      const now = new Date();
      let nextHalfHour = new Date(now);
      if (now.getMinutes() >= 30) {
        nextHalfHour.setHours(now.getHours() + 1, 0, 0, 0);
      } else {
        nextHalfHour.setHours(now.getHours(), 30, 0, 0);
      }
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      // 轉換為時間戳
      const nextHalfHourTimestamp = nextHalfHour.getTime();
      const endOfDayTimestamp = endOfDay.getTime();

      // 預約結束時間 <= 下一個時間段單位: 可進行預約
      if (nextHalfHourTimestamp < end && end <= endOfDayTimestamp) {
        console.warn(`Found ongoing reservation in ${now.toDateString()}`);
        throw new Error('BadRequest'); // 使用HTTP狀態碼或其他錯誤處理方式
      }
    }

    try {
      await this.reservationRepository.insertReservation(userId, seatId, timeslot);
    } catch (error) {
      throw error; // 可以進行進一步的錯誤處理
    }
  */
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

  // query_user_reservations

  throw new Error('Not implemented')
}

/**
 * Delete the booked seat of the user, return success or fail (true or false)
 * 
 * @url DELETE /api/user/seats/:id
 * @param id
 */
export const deleteBookedSeat = (id: string): Promise<Response<Boolean>> => {
  throw new Error('Not implemented')
}

/**
 * User early terminate the seat, return success or fail (true or false)
 * 
 * @param id 
 */
export const earlyTerminateBookedSeat = (id: string): Promise<Response<Boolean>> => {
  throw new Error('Not implemented')
}

/**
 * User extend the reserved seat, return success or fail (true or false)
 * 
 * @param id 
 * @param end 
 */
export const extendReservedSeat = (id: string, end: Date): Promise<Response<Boolean>> => {
  throw new Error('Not implemented')
}


