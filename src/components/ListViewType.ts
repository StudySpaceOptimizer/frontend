export interface Range {
  date: string,
  start: string,
  end: string
}

export interface UserBan {
  points: number,
  banned?: string,
  until?: string
}

export interface User {
  id: number,
  name: string,
  identity: string,
  email?: string,
  idCard?: string,
  ban?: UserBan,
  applyDate?: string,
}

export interface Data {
  id: number
  range?: Range,
  seat?: string,
  user?: User,
  actions?: string[]
}