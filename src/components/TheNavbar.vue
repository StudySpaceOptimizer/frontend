<script setup lang="ts">
import { ref } from 'vue'

import { useAccountStore } from '@/stores/account'

const accountStore = useAccountStore()
const activeIndex = ref('/')
</script>

<template>
  <el-menu
    :default-active="activeIndex"
    class="el-menu-demo"
    mode="horizontal"
    router="true"
    :ellipsis="false"
  >
    <el-menu-item index="/"> 全興書苑 預約系統 </el-menu-item>
    <div class="flex-grow"></div>
    <el-sub-menu index="" v-if="accountStore.isSignIn">
      <template #title>Hi, {{ accountStore.userDisplayName }}</template>
      <el-menu-item index="" @click="accountStore.signOut()">登出</el-menu-item>
      <el-menu-item index="/profile?tabs=person">個人資料</el-menu-item>
      <el-menu-item index="/profile?tabs=reservation">預約紀錄</el-menu-item>
      <el-menu-item index="/admin" v-if="accountStore.adminRole !== 'non-admin'">
        管理員介面
      </el-menu-item>
    </el-sub-menu>
    <el-menu-item index="" v-else @click="accountStore.toggleDialog('signIn')"> 登入 </el-menu-item>
  </el-menu>
</template>

<style>
.flex-grow {
  flex-grow: 1;
}
</style>
