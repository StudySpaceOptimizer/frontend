<script setup lang="ts">
import TheFilter from '@/components/TheFilter.vue'
</script>

<template>
  <TheFilter />
  <div class="map">
    <p>座位即時圖</p>
  </div>
</template>

<style scoped lang="scss">
.map {
  position: relative;
  margin-top: 16px;
  height: 500px;
  width: 80%;
  border-radius: 6px;
  background-color: #e8e8e8;

  p {
    font-size: 6em;
    display: block;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
}
</style>
