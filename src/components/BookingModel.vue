<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { useSeatStore } from '@/stores/seat'

const seatStore = useSeatStore()
const dialogVisible = ref(false)

const handleClose = (done: () => void) => {
  dialogVisible.value = false
  seatStore.unselectSeat()
  done()
}

const seatName = ref('')
watchEffect(() => {
  if (seatStore.nowSelectedSeat != null) {
    dialogVisible.value = true
    seatName.value = seatStore.nowSelectedSeat
  }
})
</script>
<template>
  <el-dialog
    v-model="dialogVisible"
    title="預約座位"
    width="500"
    :before-close="handleClose"
  >
    <span>{{ seatName }}</span>
    <div class="date"></div>
    
    <ul class="seat-list">
      <li>
        <span class="time"></span>
        <div class="seat-available"></div>
      </li>
    </ul>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="dialogVisible = false">
          預約
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
:root {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  width: 300px;
}
</style>
