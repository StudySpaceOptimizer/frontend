import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

import * as Api from '@/api'
import DependencyContainer from '@/DependencyContainer'
import * as Type from '@/types'
import { useAccountStore } from '@/stores/account'

export function useProfile() {
  const { t } = useI18n()
  const userApi = DependencyContainer.inject<Api.User>(Api.API_SERVICE.USER)
  const accountStore = useAccountStore()

  const getUserProfile = async (): Promise<Type.UserData | undefined> => {
    try {
      return await userApi.getMyUserData()
    } catch (error) {
      ElMessage.error(t('profileView.fetchProfileFailed'))
    }

    return undefined
  }

  const updateUserProfile = async (data: any): Promise<void> => {
    try {
      await userApi.updateProfile(data.id, data.name, data.phone, data.idCard)
      await accountStore.fetchUserProfile()
      ElMessage.success(t('profileView.saveChangesSuccess'))
    } catch (error) {
      ElMessage.error(t('profileView.saveChangesFailed'))
    }
  }

  return {
    getUserProfile,
    updateUserProfile
  }
}
