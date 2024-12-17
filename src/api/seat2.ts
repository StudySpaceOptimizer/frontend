import type * as Types from '../types'
import { parseTimeString } from './common'
import type { Seat } from './index'

export class LaravelSeat implements Seat {
  async getSeatsStatus(
    seatReservationFilterByTime: Types.SeatReservationFilterByTime
  ): Promise<Types.SeatData[]> {
    const { beginTime, endTime } = seatReservationFilterByTime

    const params = new URLSearchParams({
      'timeFilter[beginTime]': beginTime?.toISOString() ?? '',
      'timeFilter[endTime]': endTime?.toISOString() ?? ''
    })

    const res = await fetch(`/api/seats?${params.toString()}`)
    if (!res.ok) {
      const { error } = await res.json()
      throw new Error(error)
    }

    return await res.json()
  }

  async getSeatStatus(seatCode: string): Promise<Types.SeatDetail> {
    const res = await fetch(`/api/seats/${seatCode}`)
    if (!res.ok) {
      throw new Error('Failed to get seat detail')
    }

    const reservations = await res.json()
    return {
      seatCode,
      reservations: reservations
    }
  }

  async updateSeat(seatId: string, available: boolean, otherInfo?: string): Promise<void> {
    const res = await fetch(`/api/seats/${seatId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ available })
    })

    if (!res.ok) {
      throw new Error('Failed to update seat')
    }
  }
}
