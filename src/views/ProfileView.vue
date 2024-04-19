<script setup lang="ts">
import { computed, onMounted, watch, ref, watchEffect } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'

import * as API from '@/api'
import * as Model from '@/api/model'
import type { Filter } from '@/types'
import { useFilterStore } from '@/stores/filter'
import { useAccountStore } from '@/stores/account'
import TheFiliter from '@/components/TheFilter.vue'
import ListView from '@/components/ListView.vue'
import DependencyContainer from '@/DependencyContainer'

const api = DependencyContainer.inject<API.Reserve>(API.API_SERVICE.RESERVE)
const filterStore = useFilterStore()

const listViewData = ref<any[]>([])

function getData(config: Filter): void {
  api.getPersonalReservations(config).then((res) => {
    listViewData.value = listViewDataConstructor(res)
  })
}

// Construct data for ListView
function listViewDataConstructor(res: any): any {
  return res.map((item: any) => {
    // personal reservation unnecessary to show user's data
    item.user = null

    const nowTime = new Date().getTime()
    const beginTime = new Date(item.beginTime).getTime()
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

async function cancelBooking(id: string): Promise<void> {
  ElMessageBox.confirm('確定要取消預約嗎？' + id, '提示', {
    confirmButtonText: '確定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await api.deleteReservation(id)
      ElMessage.success('取消預約成功')
      getData(filterStore.getFilter('profile'))
    } catch (error: any) {
      ElMessage.error(error.message)
    }
  })
}

function terminateBooking(id: string): void {
  const confirm = window.confirm('確定要提前離開嗎？')
  if (!confirm) return
  api.terminateReservation(id).then(() => {
    getData(filterStore.getFilter('profile'))
  })
}

watchEffect(() => {
  getData(filterStore.getFilter('profile'))
})

const userApi = DependencyContainer.inject<API.User>(API.API_SERVICE.USER)

const userProfile = ref<Model.UserData>()
const isStudent = computed(() => userProfile.value?.userRole === 'student')
let isGetedUserProfile = false
const isUserProfileChange = ref(false)
const _test_tabs = ref('reservation')
const updateProfileForm = ref<FormInstance>()
const rules = {
  name: [
    { required: true, message: '請輸入姓名', trigger: 'blur' },
    { max: 10, message: '姓名不得超過 10 個字', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '請輸入手機號碼', trigger: 'blur' },
    { pattern: /^09\d{8}$/, message: '手機號碼格式不正確', trigger: 'blur' }
  ]
}

async function getUserProfile(): Promise<void> {
  try {
    const data = await userApi.getUsers(false)
    userProfile.value = data[0]
  } catch (error) {
    ElMessage.error('取得使用者資料失敗')
  }
}

const accountStore = useAccountStore()
async function onSaveProfile(fromEl: FormInstance | undefined): Promise<void> {
  if (!fromEl) return
  if (!(await fromEl.validate())) return

  try {
    const data = {
      id: userProfile.value?.id,
      name: userProfile.value?.name,
      phone: userProfile.value?.phone,
      idCard: userProfile.value?.idCard
    }
    await userApi.updateProfile(data)
    await accountStore.getUserProfile()
    ElMessage.success('更新成功')
  } catch (error: any) {
    ElMessage.error(`更新失敗: ${error.message}`)
  }
}

function onCanceled(): void {
  isGetedUserProfile = false
  isUserProfileChange.value = false
  getUserProfile()
}

onMounted(() => {
  isGetedUserProfile = false
  getUserProfile()
})

watch(
  userProfile,
  () => {
    if (isGetedUserProfile) {
      isUserProfileChange.value = true
    } else {
      isGetedUserProfile = true
    }
  },
  { deep: true }
)
</script>

<template>
  <el-tabs tab-position="top" class="profile-tabs" v-model="_test_tabs">
    <el-tab-pane label="預約紀錄" name="reservation">
      <TheFiliter />
      <ListView :data="listViewData" />
    </el-tab-pane>
    <el-tab-pane label="個人資料" name="profile">
      <el-container class="profile-container">
        <el-form
          ref="updateProfileForm"
          v-if="userProfile"
          :model="userProfile"
          label-width="auto"
          style="width: 600px"
          :rules="rules"
        >
          <el-form-item label="Email">
            <el-tooltip content="若需要修改電子信箱，請告知管理員" placement="topgit">
              <el-input v-model="userProfile.email" disabled />
            </el-tooltip>
          </el-form-item>
          <el-form-item label="姓名" prop="name">
            <el-input v-model="userProfile.name" />
          </el-form-item>
          <el-form-item label="電話" v-if="!isStudent">
            <el-input v-model="userProfile.phone" />
          </el-form-item>
          <el-form-item label="身分證字號" v-if="!isStudent">
            <el-input v-model="userProfile.phone" />
          </el-form-item>
          <el-form-item>
            <el-button text @click="onCanceled">取消變更</el-button>
            <el-button
              type="primary"
              @click="onSaveProfile(updateProfileForm)"
              :disabled="!isUserProfileChange"
              >儲存變更</el-button
            >
          </el-form-item>
        </el-form>
      </el-container>
    </el-tab-pane>
  </el-tabs>
</template>

<style lang="scss">
.profile-tabs {
  .el-tabs__content {
    height: 100%;
    width: 1200px;
  }
}

.el-form-item__content {
  justify-content: end;
}

.profile-container {
  padding: 20px;
  display: flex;
  justify-content: center;
}
</style>
