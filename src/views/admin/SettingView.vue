<script setup lang="ts">
import { ref } from 'vue'

import { useSettingStore } from '@/stores/setting'

const settingStore = useSettingStore()

function timeToDate(time: string | undefined) {
  if (!time) return new Date('2024-01-01T00:00:00')
  return new Date(`2024-01-01T${time}`)
}

const form = ref({
  weekday: [
    timeToDate(settingStore.settings?.weekdayOpeningHours.beginTime),
    timeToDate(settingStore.settings?.weekdayOpeningHours.endTime)
  ],
  weekend: [
    timeToDate(settingStore.settings?.weekendOpeningHours.beginTime),
    timeToDate(settingStore.settings?.weekendOpeningHours.endTime)
  ],
  studentReservationLimit: settingStore.settings?.studentReservationLimit ?? 1,
  outsiderReservationLimit: settingStore.settings?.outsiderReservationLimit ?? 1,
  reservation_time_unit: settingStore.settings?.reservation_time_unit ?? 0.5,
  maximumReservationDuration: settingStore.settings?.maximumReservationDuration ?? 24,
  pointsToBanUser: settingStore.settings?.pointsToBanUser ?? 1,
  checkinDeadlineMinutes: settingStore.settings?.checkin_deadline_minutes ?? 1,
  temporaryLeaveDeadlineMinutes: settingStore.settings?.temporary_leave_deadline_minutes ?? 1,
  checkInViolationPoints: settingStore.settings?.check_in_violation_points ?? 1,
})

function onSubmit() {
  settingStore.updateSettings({
    weekdayOpeningHours: {
      beginTime: form.value.weekday[0].toTimeString().slice(0, 5),
      endTime: form.value.weekday[1].toTimeString().slice(0, 5)
    },
    weekendOpeningHours: {
      beginTime: form.value.weekend[0].toTimeString().slice(0, 5),
      endTime: form.value.weekend[1].toTimeString().slice(0, 5)
    },
    studentReservationLimit: form.value.studentReservationLimit,
    outsiderReservationLimit: form.value.outsiderReservationLimit,
    reservation_time_unit: form.value.reservation_time_unit,
    maximumReservationDuration: form.value.maximumReservationDuration,
    pointsToBanUser: form.value.pointsToBanUser,
    checkin_deadline_minutes: form.value.checkinDeadlineMinutes,
    temporary_leave_deadline_minutes: form.value.temporaryLeaveDeadlineMinutes,
    check_in_violation_points: form.value.checkInViolationPoints,
  })
}

function makeRange(start: number, end: number) {
  const result: number[] = []
  for (let i = start; i <= end; i++) {
    result.push(i)
  }
  return result
}
</script>

<template>
  <el-form :model="form" label-width="180px" style="width: 700px; margin: auto">
    <el-form-item label="平日開館" prop="weekday">
      <el-time-picker
        v-model="form.weekday"
        is-range
        range-separator="To"
        start-placeholder="Start time"
        end-placeholder="End time"
        :disabled-seconds="() => makeRange(0, 59)"
      />
    </el-form-item>
    <el-form-item label="假日開館" prop="weekend">
      <el-time-picker
        v-model="form.weekend"
        is-range
        range-separator="To"
        start-placeholder="Start time"
        end-placeholder="End time"
        :disabled-seconds="() => makeRange(0, 59)"
      />
    </el-form-item>
    <el-form-item label="最小預約單位" prop="minimumReservationDuration">
      <el-input-number
        v-model="form.reservation_time_unit"
        :min="30"
        :max="120"
        :step="30"
      />
      <el-text style="margin-left: 10px; margin-right: auto">分鐘</el-text>
    </el-form-item>
    <el-form-item label="單次預約時間上限" prop="maximumReservationDuration">
      <el-input-number
        v-model="form.maximumReservationDuration"
        :min="0.5"
        :max="24"
        :precision="1"
        :step="0.5"
      />
      <el-text style="margin-left: 10px; margin-right: auto">小時</el-text>
    </el-form-item>
    <el-form-item label="學生提前預約期限" prop="reservationLimit">
      <el-input-number v-model="form.studentReservationLimit" :min="-1" :max="30" />
      <el-text style="margin-left: 10px; margin-right: auto">天 (0 代表僅供當天預約，-1 代表不能預約)</el-text>
    </el-form-item>
    <el-form-item label="校外人士提前預約期限" prop="outsiderReservationLimit">
      <el-input-number v-model="form.outsiderReservationLimit" :min="-1" :max="30" />
      <el-text style="margin-left: 10px; margin-right: auto">天 (0 代表僅供當天預約，-1 代表不能預約)</el-text>
    </el-form-item>
    <el-form-item label="報到時間" prop="checkin_deadline_minutes">
      <el-input-number v-model="form.checkinDeadlineMinutes" :min="1" :max="60" />
      <el-text style="margin-left: 10px; margin-right: auto">分鐘</el-text>
    </el-form-item>
    <el-form-item label="自動封禁使用者 到達" prop="pointsToBanUser">
      <el-input-number v-model="form.pointsToBanUser" :min="1" />
      <el-text style="margin-left: 10px; margin-right: auto">點自動封禁</el-text>
    </el-form-item>
    <el-form-item label="暫時中離時間" prop="temporary_leave_deadline_minutes">
      <el-input-number v-model="form.temporaryLeaveDeadlineMinutes" :min="1" :max="240" />
      <el-text style="margin-left: 10px; margin-right: auto">分鐘</el-text>
    </el-form-item>
    <el-form-item label="超過截止時間報到記" prop="check_in_violation_points">
      <el-input-number v-model="form.checkInViolationPoints" :min="1" />
      <el-text style="margin-left: 10px; margin-right: auto">點</el-text>
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="onSubmit">確認</el-button>
    </el-form-item>
  </el-form>
</template>

<style scoped lang="scss"></style>
