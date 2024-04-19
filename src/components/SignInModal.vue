<script setup lang="ts">
import { ref } from 'vue'
import { useAccountStore } from '@/stores/account'

const accountStore = useAccountStore()
const email = ref('')
const password = ref('')
const loading = ref(false)

const signIn = () => {
  loading.value = true
  accountStore.signIn(email.value, password.value).then(() => loading.value = false)
}
</script>

<template>
  <el-dialog v-model="accountStore.dialogStatus.signIn" title="登入" width="400" height="800">
    <el-form @submit.prevent="signIn" label-width="auto" style="max-width: 600px">
      <el-form-item label="Email">
        <el-input v-model="email" placeholder="請輸入Email" autofocus></el-input>
      </el-form-item>

      <el-form-item label="Password">
        <el-input
          type="password"
          v-model="password"
          placeholder="請輸入密碼"
          show-password
        ></el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="accountStore.toggleDialog('signUp')" text> 還沒有帳號？ Sign Up</el-button>
        <el-button type="primary" @click="signIn" :loading="loading"> Sign In </el-button>
      </div>
    </template>
  </el-dialog>
</template>
