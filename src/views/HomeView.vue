<script setup lang="ts">
import SeatIllustration from '@/components/SeatIllustration.vue'
import TheFilter from '@/components/TheFilter.vue'
import SeatMap from '@/components/SeatMap.vue'

import { ref, onMounted, nextTick } from 'vue'

const mapRef = ref()
const mapRefWidth = ref(mapRef.value?.offsetWidth)

onMounted(async () => {
  await nextTick()

  if (mapRef.value) {
    mapRefWidth.value = mapRef.value.offsetWidth
  }
})
</script>

<template>
  <SeatIllustration />
  <TheFilter />
  <div class="map" ref="mapRef">
    <SeatMap :width="mapRefWidth" :height="600" />
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
