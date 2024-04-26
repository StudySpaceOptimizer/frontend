// The api rule is restful api, and the response is json
export * from './common'
export { SupabaseSeat } from './seat'
export { SupabaseUser } from './user'
export { SupabaseReserve } from './reserve'

export interface User {
  signIn(username: string, password: string): Promise<any>
  signOut(): Promise<any>
  checkIsSignIn(): Promise<any>
  updateProfile(data: any): Promise<any>
  studentSignUp(name: string, username: string, password: string): Promise<any>
  outsiderSignUp(name: string, phone: string, idcard: string, email: string): Promise<any>
  getUsers(config: any): Promise<any>
  getMyUser(): Promise<any>
  banUser(id: string, reason: string, end_at: Date): Promise<any>
  unbanUser(id: string): Promise<any>
  addPointUser(id: string, point: number): Promise<any>
  updateSettings(newSettings: any): Promise<any>
  getSettings(): Promise<any>
}

export interface Seat {
  getSeatsStatus(config: any): Promise<any>
  getSeatsConfigurations(): Promise<any>
  getSeatStatus(id: number): Promise<any>
}

export interface Reserve {
  reserve(seatId: string, begin: Date, end: Date): Promise<any>
  getReservations(config: any): Promise<any>
  getPersonalReservations(config: any): Promise<any>
  deleteReservation(id: string): Promise<any>
  terminateReservation(id: string): Promise<any>
}

export const API_SERVICE = {
  USER: 'user',
  SEAT: 'seat',
  RESERVE: 'reserve'
}

export type Config = {
  page?: number
  offset?: number
}