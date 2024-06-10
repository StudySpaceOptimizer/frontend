<script setup lang="ts">
import { ref } from 'vue'

import { useSeatStore } from '@/stores/seat'
import KonvaRecursiveComponent from '@/components/KonvaRecursiveComponent.vue'

const seatStore = useSeatStore()
const props = defineProps<{
  drawStageConfig: any
  drawStage: any
}>()

const emit = defineEmits(['updateDrawStagePosition'])
const stageRef = ref()
let isDragging = false
let lastPos = { x: 0, y: 0 }

function handleWheel(e: any): void {
  e.evt.preventDefault()
  const scaleBy = 1.1
  const stage = stageRef.value.getStage()
  const oldScale = stage.scaleX()
  const pointer = stage.getPointerPosition()

  var mousePointTo = {
    x: (pointer.x - stage.x()) / oldScale,
    y: (pointer.y - stage.y()) / oldScale
  }
  let newScale = e.evt.deltaY <= 0 ? oldScale * scaleBy : oldScale / scaleBy
  newScale = Math.max(0.25, newScale)
  newScale = Math.min(3, newScale)

  stage.scale({ x: newScale, y: newScale })
  emit(
    'updateDrawStagePosition',
    pointer.x - mousePointTo.x * newScale,
    pointer.y - mousePointTo.y * newScale
  )
  stage.batchDraw()
}

function handleMouseDown(e: any): void {
  isDragging = true
  lastPos = { x: e.evt.clientX, y: e.evt.clientY }
}

function handleMouseUp(): void {
  // TODO: This is a workaround to prevent selecting seat when dragging, need to find a better way
  setTimeout(() => {
    seatStore.toggleCanSelect(true)
  }, 0)
  isDragging = false
}

function handleMouseMove(e: any): void {
  if (isDragging) {
    seatStore.toggleCanSelect(false)
    const deltaX = e.evt.clientX - lastPos.x
    const deltaY = e.evt.clientY - lastPos.y
    // TODO: optimize
    emit('updateDrawStagePosition', props.drawStageConfig.x + deltaX, props.drawStageConfig.y + deltaY)
    lastPos = { x: e.evt.clientX, y: e.evt.clientY }
  }
}
</script>

<template>
  <v-stage
    ref="stageRef"
    :config="drawStageConfig"
    @wheel="handleWheel"
    @mousemove="handleMouseMove"
    @mousedown="handleMouseDown"
    @mouseup="handleMouseUp"
  >
    <v-layer>
      <KonvaRecursiveComponent :components="drawStage.drawObject.value" />
    </v-layer>
  </v-stage>
</template>
