import type { UserData } from './user'

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