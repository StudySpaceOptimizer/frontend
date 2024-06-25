<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { FormInstance } from 'element-plus'

import type * as Types from '@/types'

const props = defineProps<{
  userProfile: Types.UserData | undefined
  rules: any
  onCanceled: () => void
  onSaveProfile: (elForm: any) => void
}>()

const userProfileForm = ref<Types.UserData | undefined>()
const isStudent = computed(() => userProfileForm.value?.userRole === 'student')
const updateProfileForm = ref<FormInstance>()
const isUserProfileChange = ref(false)

let isGetedUserProfile = false

function onFormCanceled() {
  isUserProfileChange.value = false
  props.onCanceled()
}

async function onFormSaveProfile(formEl: FormInstance | undefined) {
  if (!formEl || !(await formEl.validate())) return

  isUserProfileChange.value = false
  props.onSaveProfile(formEl)
}

watch(
  userProfileForm,
  () => {
    if (isGetedUserProfile) {
      isUserProfileChange.value = true
    } else {
      isGetedUserProfile = true
    }
  },
  { deep: true }
)

watch(
  () => props.userProfile,
  () => {
    userProfileForm.value = props.userProfile ?? ({} as Types.UserData)
  },
  { deep: true }
)
</script>

<template>
  <el-container class="profile-container" v-loading="!userProfileForm">
    <el-form
      ref="updateProfileForm"
      v-if="userProfileForm"
      :model="userProfileForm"
      label-width="auto"
      style="width: 600px"
      :rules="rules"
    >
      <el-form-item label="Email">
        <el-tooltip content="若需要修改電子信箱，請告知管理員" placement="top">
          <el-input v-model="userProfileForm.email" disabled />
        </el-tooltip>
      </el-form-item>
      <el-form-item label="姓名" prop="name">
        <el-input v-model="userProfileForm.name" />
      </el-form-item>
      <template v-if="!isStudent">
        <el-form-item label="電話">
          <el-input v-model="userProfileForm.phone" />
        </el-form-item>
        <el-form-item label="身分證字號">
          <el-input v-model="userProfileForm.phone" />
        </el-form-item>
      </template>
      <el-form-item>
        <el-button text @click="onFormCanceled">取消變更</el-button>
        <el-button
          type="primary"
          @click="onFormSaveProfile(updateProfileForm)"
          :disabled="!isUserProfileChange"
          >儲存變更</el-button
        >
      </el-form-item>
    </el-form>
  </el-container>
</template>
