export interface Filter {
  beginTime?: Date
  endTime?: Date
  identity?: 'student' | 'others'
  seat?: string
  username?: string
}

export interface UserDataFilter {
  email?: string
  isIn?: boolean
  name?: string
  role?: string
}

export interface OutsiderSignUpDataFilter {
  email?: string
  name?: string
  phone?: string
  idCard?: string
}

export interface ReservationFilter {
  userId?: string
  userRole?: string
  seatId?: number
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
