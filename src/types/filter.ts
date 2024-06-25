export interface Filter {
  beginTime?: Date
  endTime?: Date
  identity?: 'student' | 'others'
  seat?: string
  username?: string
}

export interface UserDataFilter {
  userId?: string
  email?: string
  userRole?: string
  adminRole?: string
  isVerified?: boolean
  isIn?: boolean
  name?: string
}

export interface ReservationFilter {
  userId?: string
  userRole?: string
  seatId?: string | number
  isVerified?: boolean
  beginTimeStart?: Date
  beginTimeEnd?: Date
  endTimeStart?: Date
  endTimeEnd?: Date
}

export interface SeatReservationFilterByTime {
  beginTime?: Date
  endTime?: Date
}

export interface PageFilter {
  pageSize?: number
  pageOffset?: number
}
