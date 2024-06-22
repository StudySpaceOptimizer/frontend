<script setup lang="ts">
import { ref, reactive, watchEffect, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useResizeObserver } from '@vueuse/core'

import { useFilterStore } from '@/stores/filter'
import { useSeatStore } from '@/stores/seat'
import BookingModel from '@/components/BookingModel.vue'
import DrawStage from '@/components/seats/stage'
import SeatIllustration from '@/components/SeatIllustration.vue'
import SeatMap from '@/components/SeatMap.vue'
import TheFilter from '@/components/TheFilter.vue'

// TODO: optimize this
import { useSettingStore } from '@/stores/setting'

const mapRef = ref(null)
const drawStageConfig = reactive({
  width: 0,
  height: 0,
  x: 110,
  y: 60,
  // TODO: compute center
  scaleX: 0.45,
  scaleY: 0.45,
  offsetX: 0,
  offsetY: 0
})
// TODO: move to composable
const drawStage = new DrawStage()
let isInitedDrawStage = false

useResizeObserver(mapRef, (entries) => {
  const { width, height } = entries[0].contentRect
  
  drawStageConfig.width = width
  drawStageConfig.height = height
  drawStageConfig.offsetX = -width / 2 + 80
  drawStageConfig.offsetY = -height / 2 
  if (isInitedDrawStage) return
  drawStage.draw(width, height)
  isInitedDrawStage = true
})

function UpdateDrawStagePosition(x: number, y: number): void {
  drawStageConfig.x = x
  drawStageConfig.y = y
}

const route = useRoute()
const filterStore = useFilterStore()
const seatStore = useSeatStore()
watchEffect(() => {
  const filter = filterStore.getFilter(route.name?.toString() || 'default')
  seatStore.fetchSeatsStatus(filter)
})

// TODO: optimize this
const { getSettings } = useSettingStore()

onMounted(() => {
  getSettings()
})
</script>

<template>
  <SeatIllustration />
  <div style="width: 80%; height: 100%;">
    <TheFilter />
    <el-container class="map-container" ref="mapRef">
      <BookingModel />
      <SeatMap
        :draw-stage="drawStage"
        :draw-stage-config="drawStageConfig"
        @update-draw-stage-position="UpdateDrawStagePosition"
      />
    </el-container>
  </div>
</template>

<style scoped lang="scss">
.map-container {
  position: relative;
  margin-top: 16px;
  height: 86%;
  width: 100%;
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
