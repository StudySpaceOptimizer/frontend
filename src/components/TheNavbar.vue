<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { useAccountStore } from '@/stores/account'
import { useLangStore } from '@/stores/lang'
import type { LangEnum } from '@/types'

const { t } = useI18n()
const router = useRouter()
const accountStore = useAccountStore()
const langStore = useLangStore()

const language = computed(() => langStore.lang)
const activeIndex = ref('/')

const langType: Record<LangEnum, string> = {
  'zh-tw': '中文',
  en: 'English'
}

function signOutHandler() {
  accountStore.signOut()
  router.push('/')
}

function handleCommand(command: LangEnum) {
  langStore.setLang(command)
}

function signInHandler() {
  accountStore.signIn()
}

const userTitle = computed(() => {
  return t('navbar.title', {
    name: accountStore.userDisplayName
  })
})

const selectedLanguage = computed(() => {
  return langType[language.value]
})
</script>

<template>
  <el-menu
    :default-active="activeIndex"
    class="el-menu-demo"
    mode="horizontal"
    :router="true"
    :ellipsis="false"
  >
    <el-menu-item index="/">
      {{ t('system') }}
    </el-menu-item>
    
    <div class="flex-grow"></div>
    
    <el-sub-menu index="#language">
      <template #title>{{ selectedLanguage }}</template>
      <el-menu-item index="#language-chinese" @click="handleCommand('zh-tw')">中文</el-menu-item>
      <el-menu-item index="#language-english" @click="handleCommand('en')">English</el-menu-item>
    </el-sub-menu>
    
    <el-sub-menu index="#account" v-if="accountStore.isSignIn">
      <template #title>{{ userTitle }}</template>
      <el-menu-item index="#account-signOut" @click="signOutHandler">
        {{ t('navbar.signOut') }}
      </el-menu-item>
      <el-menu-item index="/profile?tabs=person">{{ t('navbar.profile') }}</el-menu-item>
      <el-menu-item index="/profile?tabs=reservation">{{ t('navbar.reservation') }}</el-menu-item>
      <el-menu-item index="/admin" v-if="accountStore.role === 'admin'">
        管理員介面
      </el-menu-item>
    </el-sub-menu>
    
    <el-menu-item index="#account-signIn" v-else @click="signInHandler">
      {{ t('navbar.signIn') }}
    </el-menu-item>
  </el-menu>
</template>

<style>
.flex-grow {
  flex-grow: 1;
}
</style>
