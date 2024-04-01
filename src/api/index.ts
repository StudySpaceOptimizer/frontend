// The api rule is restful api, and the response is json
export * from './common'
export { SupabaseSeat } from './seat'
export { SupabaseUser } from './user'
export { SupabaseReserve } from './reserve'
export * from './mock'

export interface User {
  signIn(username: string, password: string): Promise<any>
  studentSignUp(name: string, username: string, password: string): Promise<any>
  outsiderSignUp(name: string, phone: string, idcard: string, email: string): Promise<any>
  getUsers(all: boolean): Promise<any>
  banUser(id: string, reason: string, end: Date): Promise<any>
  unbanUser(id: string): Promise<any>
  addPointUser(id: string, point: number): Promise<any>
  updateSettings(newSettings: any): Promise<any>
}

export interface Seat {
  getSeatsStatus(config: any): Promise<any>
  getSeatsConfigurations(): Promise<any>
  getSeatStatus(id: string): Promise<any>
}

export interface Reserve {
  reserve(seatId: string, begin: Date, end: Date): Promise<any>
  getPersonalReservations(config: any): Promise<any>
  deleteReservation(id: string): Promise<any>
  terminateReservation(id: string): Promise<any>
  getReserveConfiguration(): Promise<any>
  updateReserveConfiguration(config: any): Promise<any>
}

export const API_SERVICE = {
  USER: 'user',
  SEAT: 'seat',
  RESERVE: 'reserve'
}
