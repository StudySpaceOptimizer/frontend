<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import * as API from '@/api'
import type { Filter } from '@/types'
import { useFilterStore } from '@/stores/filter'
import BookingFiliter from '@/components/BookingFilter.vue'
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

    // TODO: add actions
    return item
  })
}

watchEffect(() => {
  getData(filterStore.getFilter('profile'))
})
</script>

<template>
  <h1>Profile</h1>
  <BookingFiliter />
  <ListView :data="listViewData" />
</template>

<style scoped></style>
