import { toLocalDateTime } from './common'
import { supabase } from '../service/supabase/supabase'
import type * as model from '../types/seat.ts'
import { seatConverterFromDB } from '../utils/index'
import { SupabaseUser } from './user'
import { SupabaseReserve } from './reserve'

const student = 'student@mail.ntou.edu.tw'
const bannedstudent = 'bannedstudent@mail.ntou.edu.tw'
const outsider = 'outsider@mail.com'
const admin = 'admin@mail.com'
const password = 'password'

async function signIn(email: string, password: string): Promise<any> {
  const { error: signOut } = await supabase.auth.signOut()
  if (signOut) {
    throw signOut
  }

  const { data: _, error: signIn } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  })

  if (signIn) {
    throw signIn
  }

  const {
    data: { user },
    error: getUser
  } = await supabase.auth.getUser()

  if (getUser) {
    throw getUser
  }

  return user


}

async function testReserveSuccess() {
  const user = await signIn(student, password)

  const supabaseReserve = new SupabaseReserve()
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  const beginTime = new Date(tomorrow.setHours(13, 0, 0, 0))
  const endTime = new Date(tomorrow.setHours(14, 0, 0, 0))
  const seatID = 'A2'

  try {
    await supabaseReserve.reserve(seatID, beginTime, endTime)
  } catch (e) {
    console.log(e)
  }
}

async function testBannedUserReserve() {
  const supabaseUser = new SupabaseUser()
  const supabaseReserve = new SupabaseReserve()

  var user = await signIn(student, password)
  const userId = user.id

  user = await signIn(admin, password)

  try {
    await supabaseUser.banUser(userId, 'testBannedUserReserve', new Date('2025-05-01T05:00:00'))
  } catch (error) {
    console.error('Error ban user:', error)
  }

  await signIn(student, password)

  try {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(13, 0, 0, 0)

    const seatID = 'A1'
    const beginTime = new Date(tomorrow.setHours(13, 0, 0, 0))
    const endTime = new Date(tomorrow.setHours(14, 0, 0, 0))

    const result = await supabaseReserve.reserve(seatID, beginTime, endTime)

    console.log(result)
  } catch (error) {
    console.error('Error reserving:', error)
  } finally {
    await signIn(admin, password)

    await supabaseUser.unbanUser(userId)
  }
}

async function testReserveOverTwoWeeks() {
  const user = await signIn(student, password)
  // 生成預訂資料

  const reservation = {
    beginTime: new Date('2024-07-26T10:00:00'),
    endTime: new Date('2024-07-26T12:00:00'),
    userID: user.id,
    seatID: 1
  }

  const { data, error } = await supabase
    .from('reservations')
    .insert([
      {
        begin_time: reservation.beginTime,
        end_time: reservation.endTime,
        user_id: reservation.userID,
        seat_id: reservation.seatID
      }
    ])
    .select('id')

  if (error) console.log(error)
  if (data) console.log(data[0].id)
}

async function testGetPersonalReservationsSuccess() {
  const user = await signIn(student, password)

  const { data: reservations, error } = await supabase.rpc('get_my_reservations')
  console.log(reservations, error)
}

async function testDeleteReservationSuccess() {
  const user = await signIn(student, password)

  const id = '20fc4dd0-2d14-4f98-8531-e4afe13926a1'

  const { data, error } = await supabase.from('reservations').delete().eq('id', id)

  console.log(data, error)
}

async function testTerminateReservationSuccess() {
  const user = await signIn(admin, password)

  const id = '2ea209f5-2a41-4c6c-a5b5-1f5b441b314a'

  const { data, error } = await supabase
    .from('reservations')
    .update({ end_time: new Date() })
    .eq('id', id)
    .select()

  console.log(data, error)
}

// await testReserveSuccess()
// await testGetPersonalReservationsSuccess()
// await testDeleteReservationSuccess()
// await testTerminateReservationSuccess()

import { useSettingStore } from '../stores/setting'
async function testGetSeatsStatus() {
  // 如果沒有給定config : beginTime = Now 的下一個時間段 或是 營業開始時間, endTime = 營業結束時間
  // 如果 now < 營業開始時間，beginTime = 營業開始時間
  // 如果 now > 營業結束時間，返回 'unavailable'

  /// get settings

  // const settingStore = useSettingStore()
  // if (!settingStore.settings) throw new Error('系統錯誤，找不到設定')

  // const now = new Date()
  // const isWeekend = now.getDay() === 0 || now.getDay() === 6
  // const openingHours = isWeekend
  //   ? settingStore.settings.weekendOpeningHours
  //   : settingStore.settings.weekdayOpeningHours

  let beginTime = new Date('2024-04-25T14:00:00')
  let endTime = new Date('2024-04-25T18:00:00')
  let unavailable = false

  // if (!beginTime || !endTime) {
  //   const openingTime = parseTimeString(openingHours.beginTime)
  //   const closingTime = parseTimeString(openingHours.endTime)

  //   beginTime = new Date(now.setHours(openingTime.hours, openingTime.minutes, 0, 0))
  //   endTime = new Date(now.setHours(closingTime.hours, closingTime.minutes, 0, 0))

  //   // 如果当前时间小于开业时间或超过闭店时间，处理逻辑
  //   if (now >= endTime) {
  //     unavailable = true
  //   } else if (now >= beginTime && now < endTime) {
  //     let nextPeriod = new Date(now)
  //     const minutes = nextPeriod.getMinutes()
  //     const hours = nextPeriod.getHours()

  //     if (minutes < 30 && minutes > 0) {
  //       nextPeriod.setMinutes(30, 0, 0)
  //     } else if (minutes > 30) {
  //       nextPeriod.setHours(hours + 1, 0, 0, 0)
  //     }

  //     beginTime = nextPeriod
  //   }
  // }

  const { data: seatInfo, error: getSeatsError } = await supabase.from('seats').select('*')

  if (getSeatsError) {
    throw new Error(getSeatsError.message)
  }

  const seatData: { [key: string]: model.SeatData } = {}

  if (seatInfo == null) throw new Error('找不到座位')

  seatInfo.forEach((seat: any) => {
    const seatID = seatConverterFromDB(seat.id)
    seatData[seatID] = {
      id: seatID,
      available: seat.available,
      status: seat.available && !unavailable ? 'available' : 'unavailable', // 初始化狀態
      otherInfo: seat.other_info
    }
  })

  const { data: reservationsData, error: getActiveReservationError } = await supabase
    .from('seat_reservations')
    // .from('active_seat_reservations')
    .select('*')
    .gte('begin_time', beginTime.toISOString())
    .lte('end_time', endTime.toISOString())
    .order('seat_id', { ascending: true })
    .order('begin_time', { ascending: true })

  if (getActiveReservationError) {
    throw new Error(getActiveReservationError.message)
  }

  interface TimeRange {
    start: Date
    end: Date
  }

  const seatCoverages: { [seatID: string]: TimeRange[] } = {}

  reservationsData?.forEach((reservation: any) => {
    const seatID = seatConverterFromDB(reservation.seat_id)
    if (!seatCoverages[seatID]) {
      seatCoverages[seatID] = [] // 初始化每個座位 ID 的陣列
    }

    seatCoverages[seatID].push({
      start: new Date(reservation.begin_time),
      end: new Date(reservation.end_time)
    })
  })

  Object.keys(seatCoverages).forEach((seatId) => {
    const coverage = seatCoverages[seatId]

    let currentEnd = beginTime

    console.log(currentEnd)

    // 可以用UTC時間比較
    coverage.forEach((time) => {
      if (time.start.toISOString() == currentEnd.toISOString()) {
        currentEnd = time.end
      }
    })

    if (currentEnd >= endTime) {
      seatData[seatId].status = 'reserved'
    } else {
      seatData[seatId].status = 'partiallyReserved'
    }
  })

  console.log(seatData['A1'])
}

function parseTimeString(timeStr: string): { hours: number; minutes: number } {
  const parts = timeStr.split(':')
  return { hours: parseInt(parts[0], 10), minutes: parseInt(parts[1], 10) }
}

async function testRecordUserEntryExit() {
  // 登入 student 並創建一個預約
  const studentUser = await signIn(student, password)

  const supabaseReserve = new SupabaseReserve()

  // const seatID = 'A1'
  // const beginTime = new Date(Date.now() + 3600 * 1000) // 1小時後
  // const endTime = new Date(Date.now() + 7200 * 1000) // 2小時後

  // try {
  //   await supabaseReserve.reserve(seatID, beginTime, endTime)
  // } catch (e) {
  //   console.error('預約創建失敗:', e)
  // }

  // 切換到 admin
  await signIn(admin, password)

  // 使用 RPC 調用 record_user_entry_exit
  const { error: rpcError } = await supabase.rpc('record_user_entry_exit', {
    p_user_id: '20f04ee8-48b9-4f61-b1cb-356046a4f9a5'
  })

  if (rpcError) {
    console.error('RPC 調用失敗:', rpcError)
    return
  }
}

// 運行測試函數
// await testRecordUserEntryExit().catch(console.error)

// await testGetSeatsStatus()

// const user = new SupabaseUser()
// var settings = await user.getSettings()

// console.log(settings)

// await testReserveOverTwoWeeks()
// await testBannedUserReserve()

await testReserveSuccess()
