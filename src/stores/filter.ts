import { defineStore } from 'pinia'
import type { Filter } from '@/types'
import { reactive } from 'vue'

export const useFilterStore = defineStore(
  'filter',
  () => {
    const filterMap = new Map<string, Filter>()

    const getFilter = (page: string) : Filter => {
      return filterMap.get(page) || reactive<Filter>({})
    }

    const setFilter = (page: string, _filter: Filter) : void => {
      filterMap.set(page, _filter)
    }

    const clearFilter = (page?: string) : void => {
      if (page) {
        filterMap.delete(page)
      } else {
        filterMap.clear()
      }
    }

    return {
      getFilter,
      setFilter,
      clearFilter,
    }
  }
)
