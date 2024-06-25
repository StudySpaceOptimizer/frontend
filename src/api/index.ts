export * from './common'
export { SupabaseSeat } from './seat'
export { SupabaseUser } from './user'
export { SupabaseReserve } from './reserve'
import type * as Type from '../types'

export interface User {
  signIn(username: string, password: string): Promise<string>
  signOut(): Promise<any>
  checkIsSignIn(): Promise<boolean>
  studentSignUp(username: string, password: string): Promise<void>
  outsiderSignUp(name: string, phone: string, idcard: string, email: string): Promise<any>
  getUsers(
    pageFilter: Type.PageFilter,
    userDataFilter: Type.UserDataFilter
  ): Promise<Type.UserData[]>
  getUsersCount(): Promise<number>
  verifyUser(userId: string): Promise<void>
  updateProfile(id: string, name: string, phone: string, idCard: string): Promise<void>
  banUser(id: string, reason: string, end_at: Date): Promise<void>
  unbanUser(id: string): Promise<void>
  updatePointUser(id: string, point: number): Promise<void>
  getSettings(): Promise<Type.SettingsData>
  updateSettings(settings: Type.SettingsData): Promise<void>
  grantAdminRole(userId: string, adminRole: Type.adminRole): Promise<void>
}

export interface Seat {
  getSeatsStatus(
    seatReservationFilterByTime: Type.SeatReservationFilterByTime
  ): Promise<Type.SeatData[]>
  getSeatStatus(
    pageFilter: Type.PageFilter,
    reservationFilter: Type.ReservationFilter
  ): Promise<Type.SeatDetail>
  updateSeat(seatId: string, available: boolean, otherInfo?: string): Promise<void>
}

export interface Reserve {
  reserve(seatId: string, beginTime: Date, endTime: Date): Promise<string>
  reserveForUser(idCard: string, seatId: string, beginTime: Date, endTime: Date): Promise<string>
  getReservations(
    pageFilter: Type.PageFilter,
    reservationFilter: Type.ReservationFilter
  ): Promise<Type.Reservation[]>
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
