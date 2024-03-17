import type { Reserve, User } from './index'
import type { UserData, SettingsData, ClosedPeriods } from './model'
import moment from 'moment'

const ENDPOINT = 'http://localhost:3030'
// Suppose the token and usrId can be obtained from the cookie or something where the user is logged in
const token = 'c794'
const userId = token

export class MockUser implements User {
  async signIn(email: string, password: string): Promise<any> {
    const res = await fetch(`${ENDPOINT}/user?email=${email}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    const data = await res.json()
    const user = data[0]
    if (user === undefined || user === null) {
      throw new Error('User not found')
    } else if (user.verify === false) {
      throw new Error('Please verify your email')
    } else if (user.password === password) {
      return user.id
    } else {
      throw new Error('Password incorrect')
    }
  }

  async studentSignUp(name: string, email: string, password: string): Promise<any> {
    // const response1 = await fetch(`${ENDPOINT}/user?email=${email}`, {
    //   method: 'GET',
    //   headers: {
    //     'Content-Type': 'application/json'
    //   }
    // })
    // const data1 = await response1.json()
    // if (data1 !== null) {
    //   throw new Error('User already exists')
    // }

    const verified = false
    const verification_token = 'test_token'
    const role = 'student'
    const point = 0
    const ban = null

    const response = await fetch(`${ENDPOINT}/user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        email,
        password,
        verified,
        verification_token,
        role,
        point,
        ban
      })
    })
    const data = await response.json()
    return data.id
  }

  outsiderSignUp(name: string, phone: string, idcard: string, email: string): Promise<any> {
    throw new Error('Method not implemented.')
  }

  async sendVerificationEmail(id: string): Promise<any> {
    const res = await fetch(`${ENDPOINT}/user/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ verified: true })
    })
    return await res.json()
  }

  async getUsers(all: boolean): Promise<any> {
    const token = 'c794'
    if (all) {
      const res = await fetch(`${ENDPOINT}/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      return await res.json()
    }

    const res = await fetch(`${ENDPOINT}/user?id=${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return await res.json()
  }

  async banUser(id: string, reason: string, end: Date): Promise<any> {
    const ban = {
      reason,
      end
    }

    const res = await fetch(`${ENDPOINT}/user/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ban: ban })
    })
    return await res.json()
  }

  async unbanUser(id: string): Promise<any> {
    const res = await fetch(`${ENDPOINT}/user/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ban: null })
    })
    return await res.json()
  }

  async addPointUser(id: string, point: number): Promise<any> {
    try {
      const response = await fetch(`${ENDPOINT}/user?id=${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user data')
      }

      const userData = await response.json()

      const updatedPoints = userData.point + point

      const updateResponse = await fetch(`${ENDPOINT}/user/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ point: updatedPoints })
      })

      if (!updateResponse.ok) {
        throw new Error('Failed to update user points')
      }

      return await updateResponse.json()
    } catch (e) {
      throw e
    }
  }
}

export class MockReserve implements Reserve {
  async reserve(seatID: string, begin: Date, end: Date): Promise<any> {
    try {
      // 判斷身分? -> 判斷是否在可以預約的期限內

      // check if time is in opening hours
      const settingRes = await fetch(`${ENDPOINT}/settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const settingsData: SettingsData = await settingRes.json()

      const closedPeriodsRes = await fetch(`${ENDPOINT}/closed-periods`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const closedPeriods: ClosedPeriods = await closedPeriodsRes.json()

      if (
        !isBusinessOpen(
          begin,
          end,
          settingsData.weekdayOpeningHours,
          settingsData.weekendOpeningHours,
          closedPeriods
        )
      ) {
        throw new Error('Time is not open')
      }

      // check if the duration is valid
      const duration = moment.duration(end.getTime() - begin.getTime())
      const minimumReservationDuration = moment.duration(
        settingsData.minimumReservationDuration,
        'hour'
      )
      const maximumReservationDuration = moment.duration(
        settingsData.maximumReservationDuration,
        'hour'
      )
      if (duration < minimumReservationDuration || duration > maximumReservationDuration) {
        throw new Error('Duration is not valid')
      }

      // check if the seat is available
      const seatRes = await fetch(`${ENDPOINT}/seat?id=${seatID}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const seatData: any = await seatRes.json()
      if (seatData.status === 'occupied') {
        throw new Error('Seat is occupied')
      }

      // check if the user has enough points
      const userRes = await fetch(`${ENDPOINT}/user?id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const userData: UserData = await userRes.json()

      // check if time is booked
      const res1 = await fetch(`${ENDPOINT}/reserve?seatID=${seatID}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const data1 = await res1.json()

      for (const r of data1) {
        if (r.begin <= begin && begin <= r.end) {
          throw new Error('Time already booked')
        }
      }

      // check if user is able to reserve
      const now = new Date()
      const userPendingReservationsRes = await fetch(
        `${ENDPOINT}/reserve?user=${userId}&end>${now}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      const userPendingReservationsData = await userPendingReservationsRes.json()

      for (const reservation of userPendingReservationsData) {
        // 如果身處預約當中
        // 如果當天有預約
        // 跟尚未完成的預約重疊
        if (
          (begin < reservation.end && end > reservation.begin) ||
          (end > reservation.begin && begin < reservation.end)
        ) {
          const reservationAvailableAfter = moment(reservation.end).subtract(
            settingsData.minimumReservationDuration
          )
          if (now >= reservationAvailableAfter.toDate())
            throw new Error('You have already reserved this time')
        }
      }

      const res = await fetch(`${ENDPOINT}/reserve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ seatID, begin, end, user: userId, exit: false })
      })
      const data = await res.json()
      return data.id
    } catch (e) {
      throw e
    }
  }

  async getPersonalReservations(config: any): Promise<any> {
    const [begin = '0', end = '10000000000000'] = config
    const res = await fetch(
      `${ENDPOINT}/reserve?user=${userId}&begin_lte=${begin}&end_lte=${end}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    return await res.json()
  }
  async deleteReservation(id: string): Promise<any> {
    try {
      const res1 = await fetch(`${ENDPOINT}/reserve/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // check if the reservation was already started
      const data1 = await res1.json()
      if (data1.user !== userId) {
        throw new Error('Permission denied')
      }
    } catch (error) {
      throw new Error('Seat not found')
    }

    const res = await fetch(`${ENDPOINT}/reserve/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    return res
  }
  terminateReservation(id: string): Promise<any> {
    const res = fetch(`${ENDPOINT}/reserve/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ exit: true })
    })
    return res
  }
  getReserveConfiguration(): Promise<any> {
    throw new Error('Method not implemented.')
  }
  updateReserveConfiguration(config: any): Promise<any> {
    throw new Error('Method not implemented.')
  }
}

function isBusinessOpen(
  begin: Date,
  end: Date,
  weekdayOpeningHours: SettingsData['weekdayOpeningHours'],
  weekendOpeningHours: SettingsData['weekendOpeningHours'],
  closedPeriods: ClosedPeriods
): boolean {
  // 判斷是否為周末
  const isWeekend = begin.getDay() === 0 || begin.getDay() === 6

  // 獲取當天的營業時間
  const openingHours = isWeekend ? weekendOpeningHours : weekdayOpeningHours

  // 判斷給定時間是否在當天營業時間內
  const isOpenDuringTheDay = begin >= openingHours.begin && end <= openingHours.end

  if (!isOpenDuringTheDay) {
    return false
  }

  // 檢查是否與 closedPeriods 有重疊
  for (const period of closedPeriods.closedPeriods) {
    if ((begin < period.end && end > period.begin) || (end > period.begin && begin < period.end)) {
      // 如果給定時間與任何一個 closed period 重疊，則返回 false
      return false
    }
  }

  // 如果不在 closedPeriods 中且在營業時間內，則返回 true
  return true
}
