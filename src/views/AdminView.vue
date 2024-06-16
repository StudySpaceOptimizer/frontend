<script setup lang="ts">
import type { TabsPaneContext } from 'element-plus'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const activeName = ref(route.name?.toString().split('-')[1])

const handleClick = (tab: TabsPaneContext) => {
  const routerName = tab.props.name
  router.push(`/admin/${routerName}`)
}
</script>

<template>
  <el-tabs v-model="activeName" class="demo-tabs" @tab-click="handleClick">
    <el-tab-pane label="所有預約列表" name="booking"></el-tab-pane>
    <el-tab-pane label="所有使用者列表" name="user"></el-tab-pane>
    <el-tab-pane label="座位設定" name="seat"></el-tab-pane>
    <el-tab-pane label="預約設定" name="setting"></el-tab-pane>
  </el-tabs>
  <div class="container">
    <RouterView v-slot="{ Component }">
      <KeepAlive>
        <component :is="Component" />
      </KeepAlive>
    </RouterView>
  </div>
</template>

<style scoped lang="scss">
.container {
  position: relative;
  margin-top: 16px;
  height: 600px;
  width: 90%;
  border-radius: 6px;
}
</style>
