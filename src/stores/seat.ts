import { defineStore } from 'pinia'
import { ref } from 'vue'

import * as API from '@/api'
import * as Model from '@/api/model'
import DependencyContainer from '@/DependencyContainer'
import type { Filter } from '@/types'

export const useSeatStore = defineStore('seat', () => {
  const seatApi = DependencyContainer.inject<API.Seat>(API.API_SERVICE.SEAT)
  const nowSelectedSeat = ref<string | null>(null)
  const seatsStatus = ref<Model.SeatData[]>([])
  let canSelect = true

  const selectSeat = (seatId: string) => {
    if (!canSelect) return
    nowSelectedSeat.value = seatId
  }

  const unselectSeat = () => {
    nowSelectedSeat.value = null
  }

  const toggleCanSelect = (state: boolean) => {
    canSelect = state
  }

  const fetchSeatsStatus = async (filter: Filter) => {
    seatsStatus.value =  await seatApi.getSeatsStatus({
      beginTime: filter.beginTime,
      endTime: filter.endTime
    })
  }

  const getSeatStatus = async (seatID: string) => {
    // TODO: optimize this
    return seatsStatus.value.find(seat => seat.id === seatID)
  }

  return {
    nowSelectedSeat,
    selectSeat,
    unselectSeat,
    toggleCanSelect,

    getSeatStatus,
    fetchSeatsStatus
  }
})
