<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="seat-illurstration">
    <div class="seat seat-available">{{ t('available') }}</div>
    <div class="seat seat-booked">{{ t('booked') }}</div>
    <div class="seat seat-partially-booked">{{ t('partiallyBooked') }}</div>
    <div class="seat seat-unavailable">{{ t('unavailable') }}</div>
  </div>
</template>

<style scoped lang="scss">
.seat-illurstration {
  display: flex;
  justify-content: space-evenly;
  margin-bottom: 16px;
  width: 30%;
}
</style>
