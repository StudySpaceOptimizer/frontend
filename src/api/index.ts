// The api rule is restful api, and the response is json
export * from './common'
export { PouchDbSeat } from './seat'
export { PouchDbUser } from './user'
export { PouchDbReserve } from './reserve'

export interface User {
  signIn(username: string, password: string): Promise<any>
  studentSignUp(name: string, username: string, password: string): Promise<any>
  outsiderSignUp(name: string, phone: string, idcard: string, email: string): Promise<any>
  sendVerificationEmail(email: string): Promise<any>
  getAllUsers(): Promise<any>
  banUser(id: string, reason: string, end: Date): Promise<any>
  unbanUser(id: string): Promise<any>
  addPointUser(id: string, point: number): Promise<any>
}

export interface Seat {
  getSeatsStatus(config: any): Promise<any>
  getSeatsConfigurations(): Promise<any>
  getSeatStatus(id: string): Promise<any>
}

export interface Reserve {
  bookSeat(id: string, begin: Date, end: Date): Promise<any>
  personalBookedSeats(begin: Date, end: Date): Promise<any>
  deleteBookedSeat(id: string): Promise<any>
  earlyTerminateBookedSeat(id: string): Promise<any>
  getReserveConfiguration(): Promise<any>
  updateReserveConfiguration(config: any): Promise<any>
}

export const API_SERVICE = {
  USER: Symbol('user'),
  SEAT: Symbol('seat'),
  RESERVE: Symbol('reserve')
}