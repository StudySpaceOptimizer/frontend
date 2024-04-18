export type Success = Boolean

/**
 *
 */
export type userRole = 'student' | 'outsider'
export type adminRole = 'admin' | 'assistant'

export interface UserData {
  id: string
  email: string
  userRole: userRole
  adminRole?: adminRole
  isIn: boolean
  name?: string
  phone?: string
  idCard?: string
  point: number
  ban?: {
    reason: string
    endAt: Date
  }
}

export interface Reservation {
  id: string
  beginTime: Date
  endTime: Date
  user: UserData
  seatID: string

  checkInTime?: Date

  /**
   * 紀錄使用者刷卡離開的時間
   * 預約前刪除預約 -> 刪除預約紀錄
   * 提早中止預約 -> 設置 'end'
   * 在預約結束之前刷卡離開 -> 設置 'temporaryLeaveTime'
   * 中離回來 -> 更新 'temporaryLeaveTime' 為 null
   * 如果時間 >= 'temporaryLeaveTime' + 1小時 -> 提早離開
   * 提早離開: 'end' = 'temporaryLeaveTime' + 1小時 (trigger)
   */
  temporaryLeaveTime?: Date
}

/**
 * This file contains all the api calls to the backend
 */
export interface SeatData {
  id: number
  available: boolean

  otherInfo?: string

  /**
   * The status of the seat \
   * available: the seat is available \
   * booked: the seat is booked by someone \
   * partiallyBooked: the seat is partially range time booked \
   * unavailable: the seat is unavailable
   */
  status: 'available' | 'booked' | 'partiallyBooked' | 'unavailable'
}

export interface SeatDetail {
  id: number
  /**
   * The booked range of the seat
   */
  reservations: {
    beginTime: Date
    endTime: Date

    /**
     * Need admin permission to get this field
     */
    user?: UserData
  }[]
}

export interface SettingsData {
  weekdayOpeningHours: {
    beginTime: string
    endTime: string
  }
  weekendOpeningHours: {
    beginTime: string
    endTime: string
  }
  minimumReservationDuration: number // 單位為小時，最小預約時間單位
  maximumReservationDuration: number // 單位為小時，表示單次預約時間上限
  studentReservationLimit: number // 單位為天，表示學生提前預約期限
  outsiderReservationLimit: number // 單位為天，表示校外人士提前預約期限
  pointsToBanUser: number // 達到一定的點數就自動封禁使用者
}

export interface ClosedPeriods {
  closedPeriods: {
    beginTime: Date
    endTime: Date
  }[]
}
