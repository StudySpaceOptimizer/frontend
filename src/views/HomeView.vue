<script setup lang="ts">
import SeatIllustration from '@/components/SeatIllustration.vue'
import TheFilter from '@/components/TheFilter.vue'
import SeatMap from '@/components/SeatMap.vue'

import { ref } from 'vue'
import { useResizeObserver } from '@vueuse/core'

const mapRef = ref(null)
const mapRefWidth = ref(0)
const mapRefHeight = ref(0)

useResizeObserver(mapRef, (entries) => {
  const entry = entries[0]
  mapRefWidth.value = entry.contentRect.width
  mapRefHeight.value = entry.contentRect.height
})
</script>

<template>
  <SeatIllustration />
  <TheFilter />
  <div class="map" ref="mapRef">
    <SeatMap :width="mapRefWidth" :height="mapRefHeight" />
  </div>
</template>

<style scoped lang="scss">
.map {
  position: relative;
  margin-top: 16px;
  height: 600px;
  width: 80%;
  border-radius: 6px;
  background-color: #e8e8e8;

  p {
    font-size: 8em;
    display: block;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
}
</style>
