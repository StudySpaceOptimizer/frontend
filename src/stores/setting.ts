import { ref } from 'vue'
import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'

import * as Api from '../api'
import * as Type from '../types'
import DependencyContainer from '../DependencyContainer'

export const useSettingStore = defineStore('settings', () => {
  const api = DependencyContainer.inject<Api.User>(Api.API_SERVICE.USER)

  const settings = ref<Type.SettingsData>()

  async function getSettings(): Promise<void> {
    try {
      settings.value = await api.getSettings()
    } catch (error: any) {
      ElMessage.error(`取得設定失敗: ${error.message}`)
    }
  }

  function getTodayOpeningHours(): {
    beginTime: string
    endTime: string
  } | undefined {
    const today = new Date().getDay()
    return today === 0 || today === 6
      ? settings.value?.weekendOpeningHours
      : settings.value?.weekdayOpeningHours
  }

  function getMinimumReservationDuration(): number {
    return settings.value?.minimumReservationDuration ?? 0
  }

  function getMaximumReservationDuration(): number {
    return settings.value?.maximumReservationDuration ?? 0
  }

  return {
    settings,
    getSettings,
    getTodayOpeningHours,
    getMinimumReservationDuration,
    getMaximumReservationDuration
  }
}, {
  persist: true
})
