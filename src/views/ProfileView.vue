<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import * as API from '@/api'
import type { Filter } from '@/types'
import { useFilterStore } from '@/stores/filter'
import TheFiliter from '@/components/TheFilter.vue'
import ListView from '@/components/ListView.vue'
import DependencyContainer from '@/DependencyContainer'

const api = DependencyContainer.inject<API.Reserve>(API.API_SERVICE.RESERVE)
const filterStore = useFilterStore()

const listViewData = ref<any[]>([])

const getData = (config: Filter) => {
  api.getPersonalReservations(config).then((res) => {
    listViewData.value = listViewDataConstructor(res)
  })
}

// Construct data for ListView
const listViewDataConstructor = (res: any) => {
  return res.map((item: any) => {
    // personal reservation unnecessary to show user's data
    item.user = null

    const nowTime = new Date().getTime()
    const beginTime = new Date(item.begin).getTime()
    if (beginTime > nowTime) {
      item.actions = [
        {
          text: '取消預約',
          handler: () => cancelBooking(item.id)
        }
      ]
    } else if (beginTime < nowTime && item.end > nowTime && item.exit !== true) {
      item.actions = [
        {
          text: '提前離開',
          handler: () => terminateBooking(item.id)
        }
      ]
    }
    return item
  })
}

const cancelBooking = (id: string) => {
  const confirm = window.confirm('確定要取消預約嗎？')
  if (!confirm) return
  api.deleteReservation(id).then(() => {
    getData(filterStore.getFilter('profile'))
  })
}

const terminateBooking = (id: string) => {
  const confirm = window.confirm('確定要提前離開嗎？')
  if (!confirm) return
  api.terminateReservation(id).then(() => {
    getData(filterStore.getFilter('profile'))
  })
}

watchEffect(() => {
  getData(filterStore.getFilter('profile'))
})
</script>

<template>
  <h1>Profile</h1>
  <TheFiliter />
  <ListView :data="listViewData" />
</template>
