import { reactive, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'

import * as API from '@/api'
import DependencyContainer from '@/DependencyContainer'
import { useSettingStore } from './setting'

export const useAccountStore = defineStore(
  'account',
  () => {
    const settingStore = useSettingStore()
    const api = DependencyContainer.inject<API.User>(API.API_SERVICE.USER)
    const isSignIn = ref(false)
    const userDisplayName = ref('guest')
    const userRole = ref('student')
    const adminRole = ref('non-admin')

    const userId = ref('')

    const dialogStatus = reactive({
      signIn: false,
      signUp: false
    })

    function toggleDialog(dialog?: 'signIn' | 'signUp'): void {
      for (const key in dialogStatus) {
        dialogStatus[key as keyof typeof dialogStatus] = key == dialog
      }
    }

    async function signIn({ email, password }: { email: string; password: string }): Promise<void> {
      try {
        userId.value = await api.signIn(email, password)
        isSignIn.value = true
        toggleDialog()
        ElMessage.success('登入成功')
      } catch (error: any) {
        isSignIn.value = false
        ElMessage.error(`登入失敗: ${error.message}`)
      }
    }

    async function studentSignUp({
      name,
      email,
      password
    }: {
      name: string
      email: string
      password: string
    }): Promise<void> {
      try {
        await api.studentSignUp(email, password)
        toggleDialog()
        ElMessage.success('註冊成功')
      } catch (error: any) {
        ElMessage.error(`註冊失敗: ${error.message}`)
      }
    }

    async function outsiderSignUp({
      name,
      phone,
      idCard,
      email
    }: {
      name: string
      phone: string
      idCard: string
      email: string
    }): Promise<void> {
      throw new Error('尚未開放註冊校外人士')
    }

    function signOut(): void {
      try {
        api.signOut()
        isSignIn.value = false
        userDisplayName.value = ''
        userId.value = ''
        ElMessage.success('登出成功')
      } catch (error) {
        ElMessage.error('登出失敗')
      }
    }

    async function checkIsSignIn(): Promise<void> {
      try {
        isSignIn.value = await api.checkIsSignIn()
      } catch (error) {
        ElMessage.error('登入狀態檢查失敗')
      }

      if (!isSignIn.value) {
        userId.value = ''
        userDisplayName.value = ''
        ElMessage.error('請先登入')
      }
    }

    async function getUserProfile(): Promise<void> {
      try {
        const userData = await api.getMyUser(userId.value)
        userDisplayName.value = userData.name ?? 'guest'
        userRole.value = userData.userRole ?? 'student'
        adminRole.value = userData.adminRole ?? 'non-admin'
        if (userData.name == undefined) {
          ElMessage.warning('可以到個人資料修改名稱')
        }

        settingStore.getSettings()
      } catch (error) {
        ElMessage.error('取得使用者資料失敗')
      }
    }

    watch(isSignIn, (newValue, oldValue) => {
      // TODO: optimize
      if (oldValue === false && newValue === true) {
        getUserProfile()
      }
    })

    return {
      isSignIn,
      userDisplayName,
      userRole,
      adminRole,
      dialogStatus,
      userId,

      signIn,
      signOut,
      checkIsSignIn,
      studentSignUp,
      outsiderSignUp,
      toggleDialog,
      getUserProfile
    }
  },
  {
    persist: true
  }
)
