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

  async function updateSettings(newSettings: Type.SettingsData): Promise<void> {
    try {
      await api.updateSettings(newSettings)
      settings.value = newSettings
      ElMessage.success('更新設定成功')
    } catch (error: any) {
      ElMessage.error(`更新設定失敗: ${error.message}`)
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

  function getReservationTimeUnit(): number {
    return (settings.value?.reservation_time_unit  ?? 0) / 60
  }

  function getMaximumReservationDuration(): number {
    return settings.value?.maximumReservationDuration ?? 0
  }

  return {
    settings,
    getSettings,
    updateSettings,
    getTodayOpeningHours,
    getMinimumReservationDuration: getReservationTimeUnit,
    getMaximumReservationDuration
  }
}, {
  persist: true
})
