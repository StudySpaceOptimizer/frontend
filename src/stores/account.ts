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
    const userDisplayName = ref('')
    const role = ref('user')
    const userEmail = ref('')

    async function signIn(): Promise<void> {
      const clientId = import.meta.env.VITE_OAUTH_CLIENT_ID
      const redirectUri = encodeURIComponent(import.meta.env.VITE_OAUTH_REDIRECT_URI)
      const authUrl = import.meta.env.VITE_OAUTH_AUTH_URL
    
      const url = `${authUrl}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=profile`
    
      window.location.href = url;
    }

    async function oAuthCallback(code: string): Promise<void> {
      try {
        await api.oAuthCallback(code)
        isSignIn.value = true
        fetchUserProfile()
        ElMessage.success(t('account.signInSuccess'))
      } catch (error: any) {
        ElMessage.error(t('account.signInFailed'))
      }
    }

    function signOut(): void {
      try {
        api.signOut()
        isSignIn.value = false
        userDisplayName.value = ''
        userEmail.value = ''
        ElMessage.success(t('account.signOutSuccess'))
      } catch (error) {
        ElMessage.error(t('account.signOutFailed'))
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
      userEmail.value = userData.email
      userDisplayName.value = userData.name
      role.value = userData.role
      if (userData.name === undefined) {
        ElMessage.warning(t('account.needAddDisplayName'))
      }
    }
    
    watch(isSignIn, (newValue, oldValue) => {
      if (!oldValue && newValue && userEmail.value) {
        fetchUserProfile()
      }
    })

    return {
      isSignIn,
      role,
      userDisplayName,
      userId: userEmail,

      signIn,
      oAuthCallback,
      signOut,
      fetchUserProfile
    }
  },
  {
    persist: true
  }
)
