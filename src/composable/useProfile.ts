import { ElMessage } from 'element-plus'

import * as Api from '@/api'
import DependencyContainer from '@/DependencyContainer'
import * as Type from '@/types'
import { useAccountStore } from '@/stores/account'

export function useProfile() {
  const userApi = DependencyContainer.inject<Api.User>(Api.API_SERVICE.USER)
  const accountStore = useAccountStore()

  const getUserProfile = async (): Promise<Type.UserData | undefined> => {
    try {
      const data = await userApi.getUsers(false)
      return data[0]
    } catch (error) {
      ElMessage.error('取得使用者資料失敗')
    }

    return undefined
  }

  const updateUserProfile = async (data: any): Promise<void> => {
    try {
      await userApi.updateProfile(data)
      await accountStore.getUserProfile()
      ElMessage.success('更新使用者資料成功')
    } catch (error) {
      ElMessage.error('更新使用者資料失敗')
    }
  }

  return {
    getUserProfile,
    updateUserProfile
  }
}
