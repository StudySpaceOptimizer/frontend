<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useSeatStore } from '@/stores/seat'
import { ElMessage } from 'element-plus'

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
    setSeatStatus(false, '#354876')
    return
  }

  const seatStatus = seatStore.seatsStatus.find(
    (seat) => seat.id === components.value[1].config.text
  )
  if (!seatStatus || !seatStatus.available) {
    setSeatStatus(false, '#808080')
    return
  }

  isSeat = true
  updateSeatColor(seatStatus.status)
})

function setSeatStatus(status: boolean, color: string) {
  isSeat = status
  if (components.value.length === 0) {
    return
  }
  components.value[0].config.fill = color
}

function updateSeatColor(status?: string) {
  const colorMap: Record<string, string> = {
    available: '#00bd7e',
    reserved: '#bd0000',
    partiallyReserved: '#bda700',
    default: '#808080'
  }

  const color = colorMap[status || 'default'] || colorMap['default']
  components.value[0].config.fill = color

  if (status === 'reserved') {
    isSeat = false
  }
}

function seatHandler(): void {
  if (!isSeat) {
    ElMessage.warning('請選擇其他座位')
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
