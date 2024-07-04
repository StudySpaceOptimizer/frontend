import { reactive, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

import * as API from '@/api'
import DependencyContainer from '@/DependencyContainer'
import { useSettingStore } from './setting'

export const useAccountStore = defineStore(
  'account',
  () => {
    const settingStore = useSettingStore()
    const { t } = useI18n()
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
        userId.value = await api.studentSignIn(email, password)
        isSignIn.value = true
        toggleDialog()
        ElMessage.success(t('account.signInSuccess'))
      } catch (error: any) {
        isSignIn.value = false
        ElMessage.error(error.message)
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
        ElMessage.success(t('account.signOutSuccess'))
      } catch (error) {
        ElMessage.error(t('account.signOutFailed'))
      }
    }

    async function checkIsSignIn(): Promise<void> {
      try {
        isSignIn.value = await api.checkIsSignIn()
      } catch (error: any) {
        ElMessage.error(error.message)
      }

      if (!isSignIn.value) {
        userId.value = ''
        userDisplayName.value = ''
        ElMessage.error(t('account.needSignIn'))
      }
    }

    async function fetchUserProfile() {
      try {
        const userData = await api.getMyUserData()
        updateUserProfile(userData)
        settingStore.getSettings()
      } catch (error: any) {
        ElMessage.error(error.message)
      }
    }
    
    function updateUserProfile(userData: any) {
      userDisplayName.value = userData.name ?? 'guest'
      userRole.value = userData.userRole ?? 'student'
      adminRole.value = userData.adminRole ?? 'non-admin'
      if (userData.name === undefined) {
        ElMessage.warning(t('account.needAddDisplayName'))
      }
    }
    
    watch(isSignIn, (newValue, oldValue) => {
      if (!oldValue && newValue && userId.value) {
        fetchUserProfile()
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
      outsiderSignUp,
      toggleDialog,
      fetchUserProfile
    }
  },
  {
    persist: true
  }
)
