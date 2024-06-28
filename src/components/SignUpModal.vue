<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FormInstance } from 'element-plus'

import { useAccountStore } from '@/stores/account'

const { t } = useI18n()
const accountStore = useAccountStore()
const signUpForm = ref<FormInstance>()
const otherSignUp = reactive({
  name: '',
  telphone: '',
  idCard: '',
  email: ''
})
const loading = ref(false)

const rules = {
  name: [{ required: true, message: t('namePlaceholder'), trigger: 'blur' }],
  telphone: [{ required: true, message: t('telphonePlaceholder'), trigger: 'blur' }],
  idCard: [{ required: true, message: t('idCardPlaceholder'), trigger: 'blur' }],
  email: [{ required: true, message: t('emailPlaceholder'), trigger: 'blur' }],
}

async function signUp(formEl: FormInstance | undefined): Promise<void> {
  if (!formEl) return
  if (!(await formEl.validate())) return

  loading.value = true
  await accountStore.outsiderSignUp({
    name: otherSignUp.name,
    phone: otherSignUp.telphone,
    idCard: otherSignUp.idCard,
    email: otherSignUp.email
  })
  loading.value = false
}
</script>

<template>
  <el-dialog v-model="accountStore.dialogStatus.signUp" :title="$t('signUpModal.title')" width="400px">
    <el-form
      @submit.prevent="signUp(signUpForm)"
      label-width="auto"
      style="margin-top: 20px"
      :rules="rules"
      :model="otherSignUp"
      ref="signUpForm"
    >
      <el-form-item :label="$t('signUpModal.name')">
        <el-input v-model="otherSignUp.name" :placeholder="$t('signUpModal.namePlaceholder')"></el-input>
      </el-form-item>
      <el-form-item :label="$t('signUpModal.telphone')">
        <el-input v-model="otherSignUp.telphone" :placeholder="$t('signUpModal.telphonePlaceholder')"></el-input>
      </el-form-item>
      <el-form-item :label="$t('signUpModal.idCard')">
        <el-input v-model="otherSignUp.idCard" :placeholder="$t('signUpModal.idCardPlaceholder')"></el-input>
      </el-form-item>
      <el-form-item :label="$t('signUpModal.email')">
        <el-input v-model="otherSignUp.email" :placeholder="$t('signUpModal.emailPlaceholder')"></el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="signUp(signUpForm)" :loading="loading">{{ $t('signUpModal.signUp') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>
