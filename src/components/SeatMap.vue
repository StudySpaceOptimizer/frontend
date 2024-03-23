<script setup lang="ts">
import { ref, computed } from 'vue'
import DrawStage from './seats/stage'

import KonvaRecursiveComponent from './KonvaRecursiveComponent.vue'

const props = defineProps({
  width: {
    type: Number,
    default: 1200
  }, 
  height: {
    type: Number,
    default: 400
  }
})

const stageRef = ref()

const width = computed(() => props.width)
const height = computed(() => props.height)

const isDragging = ref(false)
let lastPos = { x: 0, y: 0 }

const drawStage = new DrawStage(width, height)

const handleWheel = (e: any) => {
  e.evt.preventDefault()
  const scaleBy = 1.1
  const stage = stageRef.value.getStage()
  const oldScale = stage.scaleX()
  const pointer = stage.getPointerPosition()

  var mousePointTo = {
    x: (pointer.x - stage.x()) / oldScale,
    y: (pointer.y - stage.y()) / oldScale,
  }
  let newScale = e.evt.deltaY <= 0 ? oldScale * scaleBy : oldScale / scaleBy
  newScale = Math.max(0.5, newScale)
  newScale = Math.min(4, newScale)

  stage.scale({ x: newScale, y: newScale })
  drawStage.x = pointer.x - mousePointTo.x * newScale,
  drawStage.y = pointer.y - mousePointTo.y * newScale,
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
    const deltaX = (e.evt.clientX - lastPos.x)
    const deltaY = (e.evt.clientY - lastPos.y)
    drawStage.x += deltaX
    drawStage.y += deltaY
    lastPos = { x: e.evt.clientX, y: e.evt.clientY }
  }
}
</script>

<template>
  <v-stage
    ref="stageRef"
    :config="drawStage.config"
    @wheel="handleWheel"
    @mousemove="handleMouseMove"
    @mousedown="handleMouseDown"
    @mouseup="handleMouseUp"
  >
    <v-layer>
      <KonvaRecursiveComponent :components="drawStage.drawObject" />
    </v-layer>
  </v-stage>
</template>
