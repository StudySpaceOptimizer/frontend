import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import * as API from '../api'
import * as Type from '../types'
import DependencyContainer from '../DependencyContainer'
import type { Filter } from '../types'

export const useSeatStore = defineStore('seat', () => {
  const seatApi = DependencyContainer.inject<API.Seat>(API.API_SERVICE.SEAT)
  const nowSelectedSeat = ref<string | null>(null)
  // TODO: should expose thjis to outside
  const seatsStatus = ref<Type.SeatData[]>([])
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

  async function getSeatStatus(seatID: string): Promise<any> {
    // TODO: optimize this, this is O(n), maybe use a map?
    return computed(() => seatsStatus.value.find(seat => seat.id === seatID))
  }

  return {
    seatsStatus,
    nowSelectedSeat,
    selectSeat,
    unselectSeat,
    toggleCanSelect,

    getSeatStatus,
    fetchSeatsStatus
  }
})
