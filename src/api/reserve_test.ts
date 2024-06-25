import { toLocalDateTime } from './common'
import { supabase } from '../service/supabase/supabase'
import type * as model from '../types/seat.ts'
import { seatConverterFromDB, seatConverterToDB } from '../utils/index'
import { SupabaseUser } from './user'
import { SupabaseReserve } from './reserve'
import type * as Type from '../types'

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
  const seatID = 'A5'
  let reservationId

  try {
    reservationId = await supabaseReserve.reserve(seatID, beginTime, endTime)
  } catch (e) {
    console.log(e)
  } finally {
    if (reservationId) {
      await supabaseReserve.deleteReservation(reservationId)
    }
  }
}

async function testReserveForUser() {
  const user = await signIn(admin, password)

  const supabaseReserve = new SupabaseReserve()
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  const idCard = 'F000000000'
  const beginTime = new Date(tomorrow.setHours(13, 0, 0, 0))
  const endTime = new Date(tomorrow.setHours(14, 0, 0, 0))
  const seatID = 'A6'

  let reservationId

  try {
    reservationId = await supabaseReserve.reserveForUser(idCard, seatID, beginTime, endTime)
  } catch (e) {
    console.log(e)
  } finally {
    if (reservationId) {
      await supabaseReserve.deleteReservation(reservationId)
    }
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
  let beginTime = new Date('2024-04-25T14:00:00')
  let endTime = new Date('2024-04-25T18:00:00')
  let unavailable = false

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

// await testReserveSuccess()
await testReserveForUser()

async function getAllReservations() {
  const pageSize = 10,
    pageOffset = 0

  const user = await signIn(admin, password)

  const userId = undefined
  const userRole = 'student'
  const seatId = seatConverterToDB('A2')
  const beginTimeStart = new Date('2024-06-21T13:00:00')
  // const beginTimeStart = undefined
  // const beginTimeEnd = new Date('2024-06-21T07:00:00')
  const beginTimeEnd = undefined
  const endTimeStart = undefined
  const endTimeEnd = undefined

  const supabaseReserve = new SupabaseReserve()

  try {
    const result = await supabaseReserve.getReservations({
      pageSize,
      pageOffset,
      userId,
      userRole,
      seatId,
      beginTimeStart,
      beginTimeEnd,
      endTimeStart,
      endTimeEnd
    })

    console.log(result)
  } catch (e) {
    console.log(e)
  }
}

// await getAllReservations()

// await signIn(admin, password)

// const { error } = await supabase.rpc('set_claim', {
//   uid: 'e31510cc-c7ad-4da1-8148-f809bdd1fca0',
//   claim: 'is_verified',
//   value: true
// })

// if (error) {
//   console.log(error)
// }
