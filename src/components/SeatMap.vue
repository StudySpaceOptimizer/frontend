<script setup lang="ts">
import { ref, computed } from 'vue'
import DrawStage from './seats/stage'

import KonvaRecursiveComponent from './KonvaRecursiveComponent.vue'
import seats_data from './seats_data.json'

const props = defineProps({
  width: {
    type: Number,
    default: 1200
  }
})

const width = computed(() => props.width)

const stageConfig = ref({
  width: width.value,
  height: 1200,
  x: 0,
  y: 0
})

const stageRef = ref()
const isDragging = ref(false)
let lastPos = { x: 0, y: 0 }

const drawStage = new DrawStage(width, ref(1200), seats_data)

const handleWheel = (e: any) => {
  e.evt.preventDefault()
  const scaleBy = 1.1
  const stage = stageRef.value.getStage()
  const oldScale = stage.scaleX()

  const mousePointTo = {
    x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
    y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale
  }

  let newScale = e.evt.deltaY <= 0 ? oldScale * scaleBy : oldScale / scaleBy

  newScale = Math.max(0.5, newScale)
  newScale = Math.min(4, newScale)

  stage.scale({ x: newScale, y: newScale })

  const newPos = {
    x: -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale,
    y: -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale
  }

  stage.position(newPos)
  stage.batchDraw()
}

function handleMouseDown(e: any) {
  isDragging.value = true
  lastPos = { x: e.evt.clientX, y: e.evt.clientY }
}

function handleMouseUp() {
  isDragging.value = false
}

function handleMouseMove(e: any) {
  if (isDragging.value) {
    const deltaX = e.evt.clientX - lastPos.x
    const deltaY = e.evt.clientY - lastPos.y
    drawStage.x += deltaX
    drawStage.y += deltaY
    lastPos = { x: e.evt.clientX, y: e.evt.clientY }
  }
}
</script>

<template>
  <v-stage
    ref="stageRef"
    class="map"
    :config="drawStage.config"
    @wheel="handleWheel"
    @mousemove="handleMouseMove"
    @mousedown="handleMouseDown"
    @mouseup="handleMouseUp"
  >
    <v-layer>
      <!-- <v-rect :config="{x: 100, y: 100, width: 100, height: 100, fill: 'red'}" /> -->
      <KonvaRecursiveComponent :components="drawStage.drawObject" />
    </v-layer>
  </v-stage>
</template>

<style scoped lang="scss"></style>
