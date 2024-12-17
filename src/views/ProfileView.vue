<script setup lang="ts">
import { onMounted, watch, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

import * as Type from '@/types'
import { useReservation } from '@/composable/useReservation'
import { useProfile } from '@/composable/useProfile'
import UserProfileForm from '@/components/UserProfileForm.vue'

const { t } = useI18n()
const { updateReservationData, reservations, getCount } = useReservation()

const { getUserProfile, updateUserProfile } = useProfile()
const userProfile = ref<Type.UserData>()
const rules = {
  name: [
    { required: true, message: t('profileView.enterName'), trigger: 'blur' },
    { max: 10, message: t('profileView.nameMaxLength', { max: 10 }), trigger: 'blur' }
  ],
}

async function onGetUserProfile(): Promise<void> {
  userProfile.value = await getUserProfile()
}

async function onUpdateUserProfile(): Promise<void> {
  const data = {
    name: userProfile.value?.name,
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
    updateReservationData(1)
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

const count = ref<any>(1)
onMounted(async () => {
  loadProfileData()
  count.value = await getCount()
})

function handleCurrentChange(val: number) {
  updateReservationData(val)
}
</script>

<template>
  <el-tabs tab-position="top" class="profile-tabs" v-model="activeTabs">
    <el-tab-pane :label="$t('profileView.personalData')" name="person">
      <UserProfileForm
        :userProfile="userProfile"
        :rules="rules"
        :onCanceled="onGetUserProfile"
        :onSaveProfile="onUpdateUserProfile"
      />
    </el-tab-pane>
    <el-tab-pane
      :label="$t('profileView.reservationHistory')"
      name="reservation"
      style="padding: 10px"
    >
      <el-table :data="reservations" stripe style="width: 100%; height: 100%">
        <el-table-column prop="date" :label="$t('profileView.date')" width="120" />
        <el-table-column prop="beginTime" :label="$t('profileView.beginTime')" width="120" />
        <el-table-column prop="endTime" :label="$t('profileView.endTime')" width="120" />
        <el-table-column prop="seatId" :label="$t('profileView.seatId')" />
        <el-table-column fixed="right" :label="$t('profileView.actions')">
          <template #default="scope">
            <div v-for="action in reservations[scope.$index].actions" :key="action">
              <el-button link type="primary" size="small" @click="action.handler">{{
                action.text
              }}</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        layout="prev, pager, next"
        :total="count"
        :page-size="10"
        @current-change="handleCurrentChange"
        style="margin-top: 10px; justify-content: center"
      />
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
