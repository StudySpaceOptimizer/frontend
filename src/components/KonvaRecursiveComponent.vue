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

let isSeat = false
watchEffect(() => {
  if (components.value.length == 2) {
    isSeat = true
  }
})

const seatHandler = () => {
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
      <component :is="component.type" :config="component.config" @click="seatHandler"/>
    </template>
  </template>
</template>
