<script setup lang="ts">
import { reactive, ref, watchEffect } from 'vue'
import DrawStage from '@/components/seats/stage'
import { useSeatStore } from '@/stores/seat'

import KonvaRecursiveComponent from '@/components/KonvaRecursiveComponent.vue'
import BookingModel from '@/components/BookingModel.vue'

const seatStore = useSeatStore()
const props = defineProps({
  width: {
    type: Number,
    default: 1200
   },
  height: {
    type: Number,
    default: 600
  }
})

const stageRef = ref()
const drawStageConfig = reactive({
  width: props.width,
  height: props.height,
  x: 0,
  y: 0,
})
let isDragging = false
let lastPos = { x: 0, y: 0 }

const drawStage = new DrawStage()

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
  drawStageConfig.x = pointer.x - mousePointTo.x * newScale,
  drawStageConfig.y = pointer.y - mousePointTo.y * newScale,
  stage.batchDraw()
}

function handleMouseDown(e: any) {
  isDragging = true
  lastPos = { x: e.evt.clientX, y: e.evt.clientY }
}

function handleMouseUp() {
  // TODO: This is a workaround to prevent selecting seat when dragging, need to find a better way
  setTimeout(() => {
    seatStore.toggleCanSelect(true)
  }, 0)
  console.log('mouse up', new Date().getTime())
  isDragging = false
}

function handleMouseMove(e: any) {
  if (isDragging) {
    seatStore.toggleCanSelect(false)
    const deltaX = (e.evt.clientX - lastPos.x)
    const deltaY = (e.evt.clientY - lastPos.y)
    drawStageConfig.x += deltaX
    drawStageConfig.y += deltaY
    lastPos = { x: e.evt.clientX, y: e.evt.clientY }
  }
}

watchEffect(() => {
  // Mount the stage needs to wait parent element computed width and height
  if (props.width === 0 && props.height === 0) return
  drawStageConfig.width = props.width
  drawStageConfig.height = props.height
  drawStage.draw(props.width, props.height)
})
</script>

<template>
  <BookingModel />
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
