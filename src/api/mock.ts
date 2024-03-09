import type { Reserve, User } from './index'

const ENDPOINT = 'http://localhost:3030'
// Suppose the token and usrId can be obtained from the cookie or something where the user is logged in
const token = "c794"
const usrId = token

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
    }
    else if (user.verify === false) {
      throw new Error('Please verify your email')
    }
    else if (user.password === password) {
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

    const response = await fetch(`${ENDPOINT}/user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password })
    })
    const data = await response.json()
    return data.id
      
  }
  outsiderSignUp(name: string, phone: string, idcard: string, email: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  async sendVerificationEmail(id: string): Promise<any> {
    const res = await fetch(`${ENDPOINT}/user/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ verify: true })
    })
    return await res.json()
  }
  async getUsers(all: boolean): Promise<any> {
    const token = "c794"
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
  banUser(id: string, reason: string, end: Date): Promise<any> {
    throw new Error('Method not implemented.');
  }
  unbanUser(id: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  addPointUser(id: string, point: number): Promise<any> {
    throw new Error('Method not implemented.');
  }
}

export class MockReserve implements Reserve {
  async bookSeat(seat: string, begin: Date, end: Date): Promise<any> {
    // check if time is booked
    const res1 = await fetch(`${ENDPOINT}/reserve?user=${usrId}&exit=false`, {
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

    const res = await fetch(`${ENDPOINT}/reserve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ seat, begin, end, user: usrId, exit: false })
    })
    const data = await res.json()
    return data.id
  }
  async getPersonalBookedSeats(config: any): Promise<any> {
    const [ begin='0', end='10000000000000' ] = config
    const res = await fetch(`${ENDPOINT}/reserve?user=${usrId}&begin_lte=${begin}&end_lte=${end}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return await res.json()
  }
  async deleteBookedSeat(id: string): Promise<any> {
    try {
      const res1 = await fetch(`${ENDPOINT}/reserve/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const data1 = await res1.json()
      if (data1.user !== usrId) {
        throw new Error('Permission denied')
      }
    } catch (error) {
      throw new Error('Seat not found')
    } 

    const res = await fetch(`${ENDPOINT}/reserve/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
    })

    return res
  }
  earlyTerminateBookedSeat(id: string): Promise<any> {
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