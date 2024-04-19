<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'

import { useAccountStore } from '@/stores/account'

const accountStore = useAccountStore()
const identity = ref('student')
const signUpForm = ref<FormInstance>()
const studentSignUp = reactive({
  studentId: '',
  name: '',
  password: '',
  password_confirm: ''
})
const otherSignUp = reactive({
  name: '',
  telphone: '',
  idCard: '',
  email: ''
})
const loading = ref(false)

const rules = {
  studentId: [
    { required: true, message: '請輸入學號', trigger: 'blur' },
    { pattern: /^[0-9]{8}$/, message: '學號格式不正確', trigger: 'blur' }
  ],
  name: [{ required: true, message: '請輸入姓名', trigger: 'blur' }],
  password: [{ required: true, message: '請輸入密碼', trigger: 'blur' }],
  password_confirm: [
    { required: true, message: '請再次輸入密碼', trigger: 'blur' },
    {
      validator: (_: any, value: any, callback: any) => {
        if (value === studentSignUp.password) {
          callback()
        } else {
          callback(new Error('密碼不一致'))
        }
      },
      trigger: 'blur'
    }
  ]
}

async function signUp(formEl: FormInstance | undefined): Promise<void> {
  if (!formEl) return
  if (!(await formEl.validate())) return

  loading.value = true
  if (identity.value === 'student') {
    if (studentSignUp.password !== studentSignUp.password_confirm) {
      ElMessage.error('密碼不一致')
      loading.value = false
      return
    }
    try {
      await accountStore.studentSignUp({
        name: studentSignUp.name,
        email: studentSignUp.studentId + '@mail.ntou.edu.tw',
        password: studentSignUp.password
      })
    } catch (error: any) {
      ElMessage.error('註冊失敗:' + error.message)
    }
    loading.value = false
  } else {
    await accountStore.outsiderSignUp({
      name: otherSignUp.name,
      phone: otherSignUp.telphone,
      idCard: otherSignUp.idCard,
      email: otherSignUp.email
    })
    loading.value = false
  }
}
</script>

<template>
  <el-dialog v-model="accountStore.dialogStatus.signUp" title="註冊" width="400px">
    <el-radio-group v-model="identity">
      <el-radio-button label="student" value="student">學生</el-radio-button>
      <el-tooltip content="尚未開放校外人士註冊" placement="right">
        <el-radio-button label="others" value="student" disabled>校外人士</el-radio-button>
      </el-tooltip>
    </el-radio-group>
    <el-form
      @submit.prevent="signUp(signUpForm)"
      label-width="auto"
      style="margin-top: 20px"
      :rules="rules"
      :model="identity === 'student' ? studentSignUp : otherSignUp"
      ref="signUpForm"
    >
      <template v-if="identity === 'student'">
        <el-form-item label="信箱" prop="studentId">
          <el-input v-model="studentSignUp.studentId" placeholder="學號" maxlength="8" autofocus>
            <template #append>@mail.ntou.edu.tw</template>
          </el-input>
        </el-form-item>
        <el-form-item label="密碼" prop="password">
          <el-input
            type="password"
            v-model="studentSignUp.password"
            placeholder="請輸入密碼"
            show-password
            maxlength="32"
          ></el-input>
        </el-form-item>
        <el-form-item label="確認密碼" prop="password_confirm">
          <el-input
            type="password"
            v-model="studentSignUp.password_confirm"
            placeholder="請再次輸入密碼"
            show-password
            maxlength="32"
          ></el-input>
        </el-form-item>
      </template>

      <template v-else>
        <el-form-item label="姓名">
          <el-input v-model="otherSignUp.name" placeholder="姓名"></el-input>
        </el-form-item>
        <el-form-item label="手機">
          <el-input v-model="otherSignUp.telphone" placeholder="手機號碼"></el-input>
        </el-form-item>
        <el-form-item label="身分證字號">
          <el-input v-model="otherSignUp.idCard" placeholder="身分證字號"></el-input>
        </el-form-item>
        <el-form-item label="電子郵件">
          <el-input v-model="otherSignUp.email" placeholder="電子郵件"></el-input>
        </el-form-item>
      </template>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="accountStore.toggleDialog('signIn')" text>已經有帳號了？登入</el-button>
        <el-button type="primary" @click="signUp(signUpForm)" :loading="loading">註冊</el-button>
      </div>
    </template>
  </el-dialog>
</template>
