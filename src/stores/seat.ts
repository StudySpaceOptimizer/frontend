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

  function selectSeat(seatId: string): void {
    if (!canSelect) return
    nowSelectedSeat.value = seatId
  }

  function unselectSeat(): void {
    nowSelectedSeat.value = null
  }

  function toggleCanSelect(state: boolean): void {
    canSelect = state
  }

  async function fetchSeatsStatus(filter: Filter): Promise<void> {
    seatsStatus.value = await seatApi.getSeatsStatus({
      beginTime: filter.beginTime,
      endTime: filter.endTime
    })
  }

  async function getSeatStatus(seatID: string): Promise<Model.SeatData | undefined> {
    // TODO: optimize this
    return seatsStatus.value.find((seat) => seat.id === seatID)
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
