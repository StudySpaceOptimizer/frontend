<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{
  data: Array<any>
}>()

const bookingRecord = computed(() =>
  props.data.map((item: any) => {
    const newItem = { ...item }
    if (item.begin && item.end) {
      newItem.range = {
        date: new Date(item.begin).toLocaleDateString(),
        start: new Date(item.begin).toLocaleTimeString(),
        end: new Date(item.end).toLocaleTimeString()
      }
    }
    return newItem
  })
)
</script>

<template>
  <div class="container">
    <ul v-if="bookingRecord">
      <li v-for="item in bookingRecord" :key="item.id">
        <p v-if="item.range">{{ item.range.date }} {{ item.range.start }} ~ {{ item.range.end }}</p>
        <p v-if="item.seat">座位：{{ item.seat }}</p>
        <p v-if="item.user">{{ item.user.name }} / {{ item.user.identity }}</p>
        <p v-if="item.user?.email">{{ item.user.email }}</p>
        <p v-if="item.user?.idCard">身分證字號：{{ item.user.idCard }}</p>
        <p v-if="item.user?.ban">{{ item.user.ban.points }} 點</p>
        <p v-if="item.user?.ban?.banned">{{ item.user.ban.banned }} ~ {{ item.user.ban.until }}</p>
        <button v-for="action in item.actions" :key="action" @click="action.handler">{{ action.text }}</button>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.container {
  position: relative;
  margin-top: 16px;
  height: 500px;
  width: 80%;
  border-radius: 6px;
  background-color: #e8e8e8;

  ul {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      display: flex;
      padding: 1rem;
      border-bottom: 1px solid #ccc;

      p,
      button {
        margin: 0 6px;
      }
    }
  }
}
</style>
