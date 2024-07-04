import type { Filter } from '@/types'

export function filterToUrlQuery(filter: Filter): string {
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

export function timeToString(time?: Date): string {
  if (!time) return ''
  const year = time.getFullYear()
  const month = (time.getMonth() + 1).toString().padStart(2, '0')
  const day = time.getDate().toString().padStart(2, '0')
  const hours = time.getHours().toString().padStart(2, '0')
  const minutes = time.getMinutes().toString().padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

export function seatConverterToDB(seat: string): number | undefined {
  const prefix = seat[0]
  const rowNumber = parseInt(seat.slice(1))

  if (prefix === 'A') {
    return rowNumber
  } else if (prefix === 'B') {
    return rowNumber + 1000
  }
}

export function seatConverterFromDB(seat: number): string {
  if (seat < 1000) {
    return `A${seat.toString()}`
  } else {
    return `B${(seat - 1000).toString()}`
  }
}

export function createTimeRange(
  beginTime: number,
  endTime: number,
  step: number
): { value: string; disabled: boolean }[] {
  const times = []
  for (let hour = beginTime; hour < endTime; hour++) {
    for (let minute = 0; minute < 60; minute += step) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      times.push({ value: time, disabled: false })
    }
  }
  return times
}

export function getHourAndMinute(time?: Date): string | undefined {
  if (!time) return undefined
  return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function isJsonString(str: string): boolean {
  try {
    JSON.parse(str)
  } catch (e) {
    return false
  }
  return true
}

export function errorHandler(errorMessage: string, t: (key: string, ...data: any[]) => string, defaultError: string = 'default'): string {
  if (isJsonString(errorMessage)) {
    const { code, data = [] } = JSON.parse(errorMessage);
    return t(code, ...data);
  }
  return t(errorMessage) || t(defaultError);
}
