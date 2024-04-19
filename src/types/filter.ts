export interface Filter {
  beginTime?: Date
  endTime?: Date
  identity?: 'student' | 'others'
  seat?: string
  username?: string
}
