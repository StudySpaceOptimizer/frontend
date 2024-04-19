import { reactive, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'

import * as API from '@/api'
import DependencyContainer from '@/DependencyContainer'

export const useAccountStore = defineStore(
  'account',
  () => {
    const api = DependencyContainer.inject<API.User>(API.API_SERVICE.USER)
    const isSignIn = ref(false)
    const userDisplayName = ref('guest')

    const dialogStatus = reactive({
      signIn: false,
      signUp: false
    })

    function toggleDialog(dialog?: 'signIn' | 'signUp'): void {
      for (const key in dialogStatus) {
        dialogStatus[key as keyof typeof dialogStatus] = key == dialog
      }
    }

    async function signIn(_email: string, _password: string): Promise<void> {
      try {
        await api.signIn(_email, _password)
        isSignIn.value = true
        toggleDialog()
        ElMessage.success('登入成功')
      } catch (error: any) {
        isSignIn.value = false
        ElMessage.error(`登入失敗: ${error.message}`)
      }
    }

    async function studentSignUp(_name: string, _email: string, _password: string) {
      await api.studentSignUp(_name, _email, _password)
      toggleDialog()
      ElMessage.success('註冊成功')
    }

    async function outsiderSignUp(_name: string, _phone: string, _idcard: string, _email: string) {
      await api.outsiderSignUp(_name, _phone, _idcard, _email)
      toggleDialog()
      ElMessage.success('註冊成功')
    }

    function signOut() {
      try {
        api.signOut()
        isSignIn.value = false
        userDisplayName.value = 'guest'
        toggleDialog()
        ElMessage.success('登出成功')
      } catch (error) {
        ElMessage.error('登出失敗')
      }
    }

    async function checkIsSignIn() {
      try {
        isSignIn.value = await api.checkIsSignIn()
      } catch (error) {
        ElMessage.error('登入狀態檢查失敗')
      }

      if (!isSignIn.value) {
        ElMessage.error('請先登入')
      }
    }

    async function getUserProfile() {
      try {
        const userData = await api.getUsers(false)
        userDisplayName.value = userData[0].name ?? 'guest'
        if (userData[0].name == undefined) {
          ElMessage.warning('可以到個人資料修改名稱')
        }
      } catch (error) {
        ElMessage.error('取得使用者資料失敗')
      }
    }

    watch(isSignIn, (newValue, oldValue) => {
      if (oldValue === false && newValue === true) {
        getUserProfile()
      }
    })

    return {
      isSignIn,
      userDisplayName,
      signIn,
      signOut,
      checkIsSignIn,
      studentSignUp,
      outsiderSignUp,
      toggleDialog,
      getUserProfile,
      dialogStatus
    }
  },
  {
    persist: true
  }
)
