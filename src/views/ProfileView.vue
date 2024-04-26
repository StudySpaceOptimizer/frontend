<script setup lang="ts">
import { onMounted, watch, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import * as Type from '@/types'
import { useReservation } from '@/composable/useReservation'
import { useProfile } from '@/composable/useProfile'
import ListView from '@/components/ListView.vue'
import UserProfileForm from '@/components/UserProfileForm.vue'

const { getReservationData } = useReservation()
const reservationViewData = ref<any[]>([])

async function getUserReservationData(): Promise<void> {
  reservationViewData.value = await getReservationData()
}

const { getUserProfile, updateUserProfile } = useProfile()
const userProfile = ref<Type.UserData>()
const rules = {
  name: [
    { required: true, message: '請輸入姓名', trigger: 'blur' },
    { max: 10, message: '姓名不得超過 10 個字', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '請輸入手機號碼', trigger: 'blur' },
    { pattern: /^09\d{8}$/, message: '手機號碼格式不正確', trigger: 'blur' }
  ]
}

async function onGetUserProfile(): Promise<void> {
  userProfile.value = await getUserProfile()
}

async function onUpdateUserProfile(): Promise<void> {
  const data = {
    id: userProfile.value?.id,
    name: userProfile.value?.name,
    phone: userProfile.value?.phone,
    idCard: userProfile.value?.idCard
  }
  await updateUserProfile(data)
}

const defaultTab = 'person'
const route = useRoute()
const router = useRouter()
const activeTabs = computed({
  get: () => route.query.tabs || defaultTab,
  set: (value) => {
    if (value !== route.query.tabs) {
      router.push({ query: { ...route.query, tabs: value } })
    }
  }
})

function loadProfileData() {
  if (activeTabs.value === 'person') {
    onGetUserProfile()
  } else if (activeTabs.value === 'reservation') {
    getUserReservationData()
  }
}

watch(
  () => route.query.tabs,
  (newTab, oldTab) => {
    if (!newTab || (newTab !== 'person' && newTab !== 'reservation')) {
      router.replace({ query: { ...route.query, tabs: defaultTab } })
    } else if (newTab !== oldTab) {
      loadProfileData()
    }
  },
  { immediate: true }
)

onMounted(() => {
  loadProfileData()
})
</script>

<template>
  <el-tabs tab-position="top" class="profile-tabs" v-model="activeTabs">
    <el-tab-pane label="個人資料" name="person">
      <UserProfileForm
        :userProfile="userProfile"
        :rules="rules"
        :onCanceled="onGetUserProfile"
        :onSaveProfile="onUpdateUserProfile"
      />
    </el-tab-pane>
    <el-tab-pane label="預約紀錄" name="reservation">
      <ListView :data="reservationViewData" />
    </el-tab-pane>
  </el-tabs>
</template>

<style lang="scss">
.profile-tabs {
  .el-tabs__content {
    height: 100%;
    width: 1200px;
  }
}

.el-form-item__content {
  justify-content: end;
}

.profile-container {
  padding: 20px;
  display: flex;
  justify-content: center;
}
</style>
