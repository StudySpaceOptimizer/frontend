export interface Response<T> {
  status: number
  error?: string
  data?: T
}