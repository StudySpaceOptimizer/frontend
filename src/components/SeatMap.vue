<script setup lang="ts">
import { ref } from 'vue'

const test = ref('')

const stageSize = { width: 1200, height: 500 }
const squares = [
  {
    x: 100,
    y: 100,
    width: 50,
    height: 50,
    fill: '#00bd7e',
    id: 'rect1',
    text: '1'
  },
  {
    x: 160,
    y: 100,
    width: 50,
    height: 50,
    fill: '#bd0000',
    id: 'rect2',
    text: '2'
  },
  {
    x: 160,
    y: 160,
    width: 50,
    height: 50,
    fill: '#bda700',
    id: 'rect3',
    text: '3'
  },
  {
    x: 100,
    y: 160,
    width: 50,
    height: 50,
    fill: '#808080',
    id: 'rect4',
    text: '4'
  }
]

const handleClick = (id: string) => {
  test.value = id
}
</script>
<template>
  <v-stage ref="stage" class="map" :config="stageSize">
    <v-layer>
      <v-rect
        v-for="(square, index) in squares"
        :key="index"
        :config="square"
      />
      <v-text
        v-for="(square, index) in squares"
        :key="index"
        :config="{
          x: square.x,
          y: square.y,
          width: 50,
          height: 50,
          text: square.text,
          fontSize: 20,
          fontFamily: 'Calibri',
          fill: 'white',
          align: 'center',
          verticalAlign: 'middle'
        }"
        @click="handleClick(square.id)"
      />
    </v-layer>
  </v-stage>
</template>

<style scoped lang="scss">
</style>
