export * from './common'
export { SupabaseSeat } from './seat'
export { SupabaseUser } from './user'
export { SupabaseReserve } from './reserve'
export { LaravelUser } from './user2'
import type * as Types from '../types'

export interface User {
  oAuthCallback(code: string): Promise<void>
  signOut(): Promise<void>
  getUserData(options?: Types.PageFilter & Types.UserDataFilter): Promise<Types.UserData[]>
  getMyUserData(): Promise<Types.UserData>
  updateProfile(name: string): Promise<void>
  banUser(id: string, reason: string, end_at: Date): Promise<void>
  unbanUser(id: string): Promise<void>
  updatePointUser(id: string, point: number): Promise<void>
  getSettings(): Promise<Types.SettingsData>
  updateSettings(settings: Types.SettingsData): Promise<void>
  grantAdminRole(userId: string, role: Types.userRole): Promise<void>
}

export interface Seat {
  getSeatsStatus(
    seatReservationFilterByTime: Types.SeatReservationFilterByTime
  ): Promise<Types.SeatData[]>
  getSeatStatus(seatId: string | number): Promise<Types.SeatDetail>
  updateSeat(seatId: string, available: boolean, otherInfo?: string): Promise<void>
}

export interface Reserve {
  reserve(seatId: string, beginTime: Date, endTime: Date): Promise<string>
  reserveForUser(idCard: string, seatId: string, beginTime: Date, endTime: Date): Promise<string>
  getReservations(
    options?: Types.PageFilter & Types.ReservationFilter
  ): Promise<Types.Reservation[]>
  getMyReservations(options?: Types.PageFilter): Promise<Types.Reservation[]>
  getPersonalReservationsCount(): Promise<number>
  getAllReservationsCount(): Promise<number>
  deleteReservation(id: string): Promise<void>
  terminateReservation(id: string): Promise<void>
}

export const API_SERVICE = {
  USER: 'user',
  SEAT: 'seat',
  RESERVE: 'reserve'
}
