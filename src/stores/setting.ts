import { ref } from 'vue'
import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

import * as Api from '@/api'
import * as Type from '@/types'
import DependencyContainer from '@/DependencyContainer'

export const useSettingStore = defineStore('settings', () => {
  const { t } = useI18n()
  const api = DependencyContainer.inject<Api.User>(Api.API_SERVICE.USER)

  const settings = ref<Type.SettingsData>()

  async function getSettings(): Promise<void> {
    try {
      settings.value = await api.getSettings()
    } catch (error: any) {
      ElMessage.error(error.message)
    }
  }

  async function updateSettings(newSettings: Type.SettingsData): Promise<void> {
    try {
      await api.updateSettings(newSettings)
      settings.value = newSettings
      ElMessage.success(t('account.updateSettingsSuccess'))
    } catch (error: any) {
      ElMessage.error(error.message)
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
    getReservationTimeUnit,
    getMaximumReservationDuration
  }
}, {
  persist: true
})
