// The api rule is restful api, and the response is json
export * from './common'
export { SupabaseSeat } from './seat'
export { SupabaseUser } from './user'
export { SupabaseReserve } from './reserve'

export interface User {
  signIn(username: string, password: string): Promise<any>
  signOut(): Promise<any>
  checkIsSignIn(): Promise<any>
  studentSignUp(username: string, password: string): Promise<any>
  outsiderSignUp(name: string, phone: string, idcard: string, email: string): Promise<any>
  getUsers(config: any, userId?: string): Promise<any>
  getUsersCount(): Promise<any>
  getMyUser(userId: string): Promise<any>
  banUser(id: string, reason: string, end_at: Date): Promise<any>
  unbanUser(id: string): Promise<any>
  updatePointUser(id: string, point: number): Promise<any>
  updateProfile(id: string, name: string, phone: string, idCard: string): Promise<any>
  getSettings(): Promise<any>
  updateSettings(settings: any): Promise<any>

  updateUserPassword(newPassword: string): Promise<any>
}

export interface Seat {
  getSeatsStatus(config: any): Promise<any>
  getSeatsConfigurations(): Promise<any>
  getSeatStatus(id: string): Promise<any>
  updateSeat(seatID: string, available: boolean, otherInfo?: string): Promise<any>
}

export interface Reserve {
  reserve(seatId: string, begin: Date, end: Date): Promise<any>
  getPersonalReservations(config: any): Promise<any>
  getPersonalReservationsCount(): Promise<any>
  deleteReservation(id: string): Promise<any>
  terminateReservation(id: string): Promise<any>
  getAllReservations(
    config: any,
    userID?: string,
    userRole?: string,
    seatID?: string,
    beginTimeStart?: Date,
    beginTimeEnd?: Date,
    endTimeStart?: Date,
    endTimeEnd?: Date
  ): Promise<any>
  getAllReservationsCount(): Promise<any>

  // 報到、離開
}

export const API_SERVICE = {
  USER: 'user',
  SEAT: 'seat',
  RESERVE: 'reserve'
}

export type Config = {
  pageSize?: number
  pageOffset?: number
}
