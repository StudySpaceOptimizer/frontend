<template>
  <div class="seat-illurstration">
    <div class="seat seat-available">可預約</div>
    <div class="seat seat-booked">已預約</div>
    <div class="seat seat-partially-booked">部分時段已預約</div>
    <div class="seat seat-unavailable">該座位不可使用</div>
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
