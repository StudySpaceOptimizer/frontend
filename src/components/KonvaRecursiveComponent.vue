<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useSeatStore } from '@/stores/seat'

const seatStore = useSeatStore()

const props = defineProps({
  components: {
    type: Array,
    required: true
  }
})
const components = computed<any[]>(() => props.components)

function checkIsSeat(): boolean {
  if (components.value.length !== 2) {
    return false
  }
  const type = components.value[0].id
  if (type != 'chair-0') {
    return false
  }
  return true
}

let isSeat = false
watchEffect(async () => {
  if (!checkIsSeat()) {
    isSeat = false
    return
  }

  const seatStatus = seatStore.seatsStatus.find(
    (seat) => seat.id === components.value[1].config.text
  )
  if (!seatStatus) {
    components.value[0].config.fill = '#808080'
    isSeat = false
    return
  }

  isSeat = true

  // TODO: optimize, refactor
  const status = seatStatus?.status
  switch (status) {
    case 'available':
      components.value[0].config.fill = '#00bd7e'
      break
    case 'reserved':
      components.value[0].config.fill = '#bd0000'
      break
    case 'partiallyReserved':
      components.value[0].config.fill = '#bda700'
      break
    default:
      components.value[0].config.fill = '#808080'
      isSeat = false
  }
})

function seatHandler(): void {
  if (!isSeat) {
    return
  }

  let seat = components.value[1].config.text
  seatStore.selectSeat(seat)
}
</script>

<template>
  <template v-for="component in components" :key="component.id">
    <template v-if="component.type === 'v-group'">
      <v-group :config="component.config">
        <KonvaRecursiveComponent :components="component.children" />
      </v-group>
    </template>
    <template v-else>
      <component :is="component.type" :config="component.config" @click="seatHandler" />
    </template>
  </template>
</template>
