<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const activeRoute = computed(() => route.path.split('/')[2])
</script>

<template>
  <p>Admin</p>
  <div class="container">
    <div class="row">
      <div class="col-2">
        <RouterLink
          to="/admin/booking"
          :class="activeRoute == 'booking' || activeRoute == null ? 'active' : ''"
          >所有預約列表</RouterLink
        >
        <RouterLink to="/admin/user" :class="activeRoute == 'user' ? 'active' : ''"
          >所有使用者列表</RouterLink
        >
        <RouterLink to="/admin/visitor" :class="activeRoute == 'visitor' ? 'active' : ''"
          >校外人士註冊</RouterLink
        >
        <RouterLink to="/admin/seat" :class="activeRoute == 'seat' ? 'active' : ''"
          >座位設定</RouterLink
        >
        <RouterLink to="/admin/book" :class="activeRoute == 'book' ? 'active' : ''"
          >預約設定</RouterLink
        >
      </div>
      <div class="col-10 child-view">
        <RouterView />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.container {
  position: relative;
  margin-top: 16px;
  height: 600px;
  width: 90%;
  border-radius: 6px;
  background-color: #e8e8e8;
}

.row {
  display: flex;
  flex-direction: row;
  height: 100%;
  width: 100%;

  .col-2 {
    display: flex;
    flex-direction: column;
    width: calc(100% * 2 / 12);
    height: 100%;
    padding: 1rem;
    border-right: 1px solid #ccc;

    a {
      padding: 1rem;
      border-bottom: 1px solid #ccc;
      text-decoration: none;

      &.active {
        background-color: #474747;
        color: #ccc !important;
      }

      &:hover:not(.active) {
        background-color: #ccc;
      }

      &:active {
        background-color: #aaa;
      }

      &:visited {
        color: #000;
      }
    }
  }

  .col-10 {
    display: flex;
    flex-direction: column;
    width: calc(100% * 10 / 12);
    height: 100%;
    padding: 1rem;
  }
}
</style>
