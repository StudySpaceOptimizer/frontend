import type * as Types from '@/types'
import type { Reserve } from './index'

export class LaravelReserve implements Reserve {
  async reserve(seatCode: string, beginTime: Date, endTime: Date): Promise<string> {
    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        seat_code: seatCode,
        begin_time: beginTime,
        end_time: endTime,
      }),
    })

    if (!res.ok) {
      const { error } = await res.json()
      throw new Error(error)
    }

    return (await res.json()).id
  }
  
  async getReservations(options?: Types.PageFilter & Types.ReservationFilter): Promise<Types.Reservation[]> {
    const { pageSize, pageOffset } = options || {}

    const res = await fetch(`/api/reservations?limit=${pageSize}&offset=${pageOffset}`)

    if (!res.ok) {
      const { error } = await res.json()
      throw new Error(error)
    }

    return await res.json()
  }
  
  // TODO: optimize return type
  async getMyReservations(options?: Types.PageFilter): Promise<any> {
    const { pageSize, pageOffset } = options || {}

    const res = await fetch(`/api/reservations/me?limit=${pageSize}&offset=${pageOffset}`)

    if (!res.ok) {
      throw new Error('Failed to get reservations')
    }

    const data = await res.json()

    const ret = {
      total: data.total,
      data: data.data.map((item: any) => {
        const seatId = item.seatId + 1
        if (seatId < 140) {
          item.seatId = `B${seatId.toString().padStart(2, '0')}`
        } else {
          item.seatId = `A${(seatId - 140).toString().padStart(2, '0')}`
        }

        return item
      }),
    }

    return ret
  }
  
  async deleteReservation(id: string): Promise<void> {
    const res = await fetch(`/api/reservations/${id}`, {
      method: 'DELETE',
    })

    if (!res.ok) {
      throw new Error('Failed to delete reservation')
    }
  }
}