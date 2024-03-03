import type { Reserve, User } from './index'

const ENDPOINT = 'http://localhost:3030'

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