export interface Filter {
  begin?: Date
  end?: Date
  identity?: 'student' | 'others'
  seat?: string
  username?: string
}
