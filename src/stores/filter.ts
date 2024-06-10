import { defineStore } from 'pinia'
import type { Filter } from '@/types'
import { reactive } from 'vue'

export const useFilterStore = defineStore('filter', () => {
  const filterMap = reactive(new Map<string, Filter>())

  function getFilter(page: string='home'): Filter {
    return filterMap.get(page) || reactive<Filter>({})
  }

  function setFilter(page: string, _filter: Filter): void {
    filterMap.set(page, _filter)
  }

  function clearFilter(page?: string): void {
    if (page) {
      filterMap.delete(page)
    } else {
      filterMap.clear()
    }
  }

  return {
    getFilter,
    setFilter,
    clearFilter
  }
})
