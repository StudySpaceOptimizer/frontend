import type * as Types from '../types'
import type { User } from './index'

export class LaravelUser implements User {
  async oAuthCallback(code: string): Promise<void> {
    const res = await fetch(`/api/auth/callback?code=${code}`)
    if (!res.ok) {
      throw new Error('Failed to login')
    }

    console.log(await res.json())
  }
  async signOut(): Promise<void> {
    
  }
  getUserData(options?: Types.PageFilter & Types.UserDataFilter): Promise<Types.UserData[]> {
    throw new Error('Method not implemented.')
  }
  async getMyUserData(): Promise<Types.UserData> {
    const res = await fetch('/api/users/me')
    if (!res.ok) {
      throw new Error('Failed to get user data')
    }

    return await res.json()
  }
  async updateProfile(name: string): Promise<void> {
    const res = await fetch(`/api/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name })
    })

    if (!res.ok) {
      throw new Error('Failed to update profile')
    }

    return await res.json()
  }
  banUser(id: string, reason: string, end_at: Date): Promise<void> {
    throw new Error('Method not implemented.')
  }
  unbanUser(id: string): Promise<void> {
    throw new Error('Method not implemented.')
  }
  updatePointUser(id: string, point: number): Promise<void> {
    throw new Error('Method not implemented.')
  }
  getSettings(): Promise<Types.SettingsData> {
    // TODO: fetch global settings
    const settings: Types.SettingsData = {
      weekdayOpeningHours: {
        beginTime: '08:00',
        endTime: '20:00'
      },
      weekendOpeningHours: {
        beginTime: '08:00',
        endTime: '20:00'
      },
      maximumReservationDuration: 2,
      studentReservationLimit: 3,
      outsiderReservationLimit: 1,
      pointsToBanUser: 10,
      checkin_deadline_minutes: 10,
      temporary_leave_deadline_minutes: 30,
      check_in_violation_points: 5,
      reservation_time_unit: 30
    }

    return Promise.resolve(settings)
  }
  updateSettings(settings: Types.SettingsData): Promise<void> {
    throw new Error('Method not implemented.')
  }
  grantAdminRole(userId: string, role: Types.userRole): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
