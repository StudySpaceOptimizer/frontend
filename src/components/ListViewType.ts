/**
 * @deprecated
 */
export interface Range {
  date: string
  start: string
  end: string
}

/**
 * @deprecated
 */
export interface UserBan {
  points: number
  banned?: string
  until?: string
}

/**
 * @deprecated
 */
export interface User {
  id: number
  name: string
  identity: string
  email?: string
  idCard?: string
  ban?: UserBan
  applyDate?: string
}

/**
 * @deprecated
 */
export interface Data {
  id: number
  range?: Range
  seat?: string
  user?: User
  actions?: string[]
}
