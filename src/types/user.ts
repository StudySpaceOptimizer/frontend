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

export interface SettingsData {
  weekdayOpeningHours: {
    beginTime: string
    endTime: string
  }
  weekendOpeningHours: {
    beginTime: string
    endTime: string
  }
  maximumReservationDuration: number // 單次預約時間上限(小時)
  studentReservationLimit: number // 學生提前預約期限(天)
  outsiderReservationLimit: number // 校外人士提前預約期限(天)
  pointsToBanUser: number // 達到一定的點數就自動封禁使用者
  checkin_deadline_minutes: number // checkin 時間(分鐘)
  temporary_leave_deadline_minutes: number // 暫時中離時間(分鐘)
  check_in_violation_points: number // 違反 checkin 截止時間時增加的點數
  reservation_time_unit: number // 最小預約的單位(分鐘)
}

export interface PasswordForm {
  password: string
  repeatPassword: string
}
