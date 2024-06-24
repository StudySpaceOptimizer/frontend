export interface Filter {
  beginTime?: Date
  endTime?: Date
  identity?: 'student' | 'others'
  seat?: string
  username?: string
}

export interface UserDataFilter {
  userID?: string
  email?: string
  userRole?: string
  adminRole?: string
  isIn?: boolean
  name?: string
}

export interface ReservationFilter {
  userID?: string
  userRole?: string
  seatID?: number
  beginTimeStart?: Date
  beginTimeEnd?: Date
  endTimeStart?: Date
  endTimeEnd?: Date
}
