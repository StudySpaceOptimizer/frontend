export interface Filter {
  start?: Date
  end?: Date
  identity?: 'student' | 'others'
  seat?: string
  username?: string
}
