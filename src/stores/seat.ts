import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSeatStore = defineStore('seat', () => {
  const nowSelectedSeat = ref<string | null>(null)

  const selectSeat = (seatId: string) => {
    nowSelectedSeat.value = seatId
  }

  const unselectSeat = () => {
    nowSelectedSeat.value = null
  }

  return {
    nowSelectedSeat,
    selectSeat,
    unselectSeat
  }
})
