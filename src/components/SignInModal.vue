<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { useAccountStore } from '@/stores/account'

const { t } = useI18n()
const accountStore = useAccountStore()
const email = ref('')
const password = ref('')
const loading = ref(false)

function signIn(): void {
  loading.value = true
  accountStore
    .signIn({
      email: email.value,
      password: password.value
    })
    .then(() => (loading.value = false))
}
</script>

<template>
  <el-dialog
    v-model="accountStore.dialogStatus.signIn"
    :title="t('signInModal.title')"
    width="400"
    height="800"
  >
    <el-form @submit.prevent="signIn" label-width="auto" style="max-width: 600px">
      <el-form-item :label="t('signInModal.emailLabel')">
        <el-input
          v-model="email"
          :placeholder="t('signInModal.emailPlaceholder')"
          autofocus
        ></el-input>
      </el-form-item>
      <el-form-item :label="t('signInModal.passwordLabel')">
        <el-input
          type="password"
          v-model="password"
          :placeholder="t('signInModal.passwordPlaceholder')"
          show-password
        ></el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="accountStore.toggleDialog('signUp')" text>
          {{ t('signInModal.signUp') }}</el-button
        >
        <el-button type="primary" @click="signIn" :loading="loading">
          {{ t('signInModal.signIn') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>
