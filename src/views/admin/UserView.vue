<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import * as Api from '@/api'
import DependencyContainer from '@/DependencyContainer'
import { timeToString } from '@/utils'

const userApi = DependencyContainer.inject<Api.User>(Api.API_SERVICE.USER)
const users = ref<any[]>([])

async function getUserData(page: number) {
  try {
    const data = await userApi.getUsers({
      pageSize: 10,
      pageOffset: Math.max(0, (page - 1) * 10)
    })
    return data
  } catch (error: any) {
    ElMessage.error(error.message)
    return []
  }
}

const count = ref(0)

async function handleCurrentChange(val: number) {
  try {
    users.value = await getUserData(val)
  } catch (error: any) {
    ElMessage.error(error.message)
  }
}

function roleToString(role: string, admin: string) {
  if (role === 'student') {
    return admin === 'admin' ? '學生 / 工讀生' : '學生'
  } else {
    return admin === 'admin' ? '管理員' : '校外人士'
  }
}

async function handleBan(row: any) {
  if (row.ban) {
    const confirmText = `確定要解除禁用 ${row.email} / ${row.name} 嗎？`
    const confirmResult = await ElMessageBox.confirm(confirmText, '提示', {
      confirmButtonText: '確定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    if (!confirmResult) return

    await userApi.unbanUser(row.id)
    ElMessage.success('解除禁用成功')
    row.ban = null
  } else {
    try {
      const reasonResult = await ElMessageBox.prompt('請輸入禁用原因', '禁用', {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        inputPattern: /\S/,
        inputErrorMessage: '禁用原因不能為空'
      })

      const reason = reasonResult.value

      const daysResult = await ElMessageBox.prompt('請輸入禁用天數', '禁用', {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        inputPattern: /\d+/,
        inputErrorMessage: '禁用天數必須為數字'
      })

      const days = new Date().getTime() + parseInt(daysResult.value) * 24 * 60 * 60 * 1000
      const date = new Date(new Date(days).setHours(0, 0, 0, 0))

      const confirmText = `確定要禁用 ${row.email} / ${row.name} 嗎？<br />
        禁用原因：${reason}<br />
        禁用天數：${daysResult.value} 天 <br />
        封禁到期時間：${date.toLocaleString()}`

      const confirmResult = await ElMessageBox.confirm(confirmText, '提示', {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: true
      })

      if (!confirmResult) return

      const data = await userApi.banUser(row.id, reason, date)
      row.ban = data
    } catch (error: any) {
      if (error.message === '' || error.message === undefined) return
      ElMessage.error(error.message)
    }
  }

  users.value = await getUserData(0)
}

const showAddPointConfirm = ref(new Map<number, boolean>())

async function handleAddPoint(row: any) {
  showAddPointConfirm.value.set(row.id, false)

  try {
    await userApi.updatePointUser(row.id, row.point)
  
    ElMessage.success('修改違規點數成功')
  } catch (error: any) {
    ElMessage.error(error.message)
  }

  users.value = await getUserData(0)
}

onMounted(async () => {
  users.value = await getUserData(1)
  count.value = await userApi.getUsersCount()
})
</script>

<template>
  <el-table :data="users" stripe style="width: 100%; height: 460px">
    <el-table-column prop="email" label="Email" width="360" />
    <el-table-column prop="name" label="名字" />
    <el-table-column prop="userRole" label="身份">
      <template #default="{ row }">
        {{ roleToString(row.userRole, row.adminRole) }}
      </template>
    </el-table-column>
    <el-table-column prop="phone" label="電話" />
    <el-table-column prop="idCard" label="身分證字號" />
    <el-table-column prop="point" label="違規點數" width="180">
      <template #default="{ row }">
        <el-row>
          <el-col :span="16">
            <el-input-number v-model="row.point" :min="0" :max="999" style="width: 100%" @change="showAddPointConfirm.set(row.id, true)" />
          </el-col>
          <el-col :span="8">
            <el-button v-if="showAddPointConfirm.get(row.id)" link type="primary" @click="handleAddPoint(row)" style="line-height: 28px;" > 確認 </el-button>
          </el-col>
        </el-row>
      </template>
    </el-table-column>
    <el-table-column prop="ban" label="禁用狀態" width="250">
      <template #default="{ row }">
        <el-tooltip
          v-if="row.ban"
          class="box-item"
          effect="dark"
          :content="row.ban.reason"
          placement="top-start"
        >
          <el-text>
            {{ `已禁用至 ${timeToString(row.ban.endAt).split(' ')[0]}` }}
          </el-text>
        </el-tooltip>
        <el-text v-else>未禁用</el-text>
      </template>
    </el-table-column>
    <el-table-column fixed="right" label="操作" width="250">
      <template #default="{ row }">
        <el-button link type="primary" size="small" @click="handleBan(row)">
          {{ row.ban ? '解除禁用' : '禁用' }}
        </el-button>
      </template>
    </el-table-column>
  </el-table>
  <el-pagination
    layout="prev, pager, next"
    :total="count"
    :page-size="10"
    @current-change="handleCurrentChange"
    style="margin-top: 10px; justify-content: center"
  />
</template>
