import type { Filter } from '@/types'

export const filterToUrlQuery = (filter: Filter) => {
  return Object.entries(filter)
    .filter(([, value]) => value !== '' && value !== null && value !== undefined)
    .map(([key, value]) => {
      if (key === 'begin' || key === 'end') {
        return [key, value.getTime()]
      }
      return [key, value]
    })
    .map(([key, value]) => `${key}=${value}`)
    .join('&')
}

export const timeToString = (time?: Date): string => {
  if (!time) return ''
  const year = time.getFullYear()
  const month = (time.getMonth() + 1).toString().padStart(2, '0')
  const day = time.getDate().toString().padStart(2, '0')
  const hours = time.getHours().toString().padStart(2, '0')
  const minutes = time.getMinutes().toString().padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

export const seatConverterToDB = (seat: string) => {
  const prefix = seat[0]
  const rowNumber = parseInt(seat.slice(1))

  if (prefix === 'A') {
    return rowNumber
  } else if (prefix === 'B') {
    return rowNumber + 1000
  }
}

export const seatConverterFromDB = (seat: number) => {
  if (seat < 1000) {
    return `A${seat.toString().padStart(2, '0')}`
  } else {
    return `B${(seat - 1000).toString().padStart(2, '0')}`
  }
}