import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSeatStore = defineStore('seat', () => {
  const nowSelectedSeat = ref<string | null>(null)
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

  return {
    nowSelectedSeat,
    selectSeat,
    unselectSeat,
    toggleCanSelect,
  }
})
