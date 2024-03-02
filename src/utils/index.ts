import type { Filter } from '@/types'

export const filterToUrlQuery = (filter: Filter) => {
  return Object.entries(filter)
    .filter(([, value]) => value !== '' && value !== null && value !== undefined)
    .map(([key, value]) => {
      if (key === 'start' || key === 'end') {
        return [key, value.getTime()]
      }
      return [key, value];
    })
    .map(([key, value]) => `${key}=${value}`)
    .join('&')
}
