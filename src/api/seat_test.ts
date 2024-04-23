import type * as Type from '@/types'
import { toLocalDateTime } from './common'
import type { Seat } from './index'
import { supabase } from '../service/supabase/supabase'

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

async function testGetSeatStatusUser() {
  const user = await signIn(student, password)

  const seatID = 1

  const { data: active_seat_reservations, error } = await supabase
    .from('active_seat_reservations')
    .select('*')
    .eq('seat_id', seatID)

  const seatDetail: Type.SeatDetail = {
    id: seatID.toString(),
    reservations:
      active_seat_reservations?.map((reservation: any) => ({
        beginTime: toLocalDateTime(reservation.begin_time),
        endTime: toLocalDateTime(reservation.end_time),
        user: undefined // 這裡設為 undefined，假設你沒有權限或無法取得 user 資料
      })) || []
  }

  console.log(active_seat_reservations)
  console.log(seatDetail, error)
}

async function testGetSeatStatusAdmin() {
  const user = await signIn(admin, password)

  const seatID = 1

  const { data: active_seat_reservations, error } = await supabase.rpc(
    'get_seat_active_reservations',
    {
      seatID
    }
  )

  console.log(active_seat_reservations, error)

  const seatDetail: Type.SeatDetail = {
    id: seatID.toString(),
    reservations:
      active_seat_reservations?.map((reservation: any) => ({
        beginTime: toLocalDateTime(reservation.begin_time),
        endTime: toLocalDateTime(reservation.end_time),
        user: {
          id: reservation.user_id,
          email: reservation.email,
          userRole: reservation.user_role,
          adminRole: reservation.admin_role,
          isIn: reservation.is_in,
          name: reservation.name,
          phone: reservation.phone,
          idCard: reservation.id_card,
          point: reservation.point,
          ban: reservation.blacklist
            ? {
                reason: reservation.blacklist[0].reason,
                endAt: new Date(reservation.blacklist[0].end_at)
              }
            : undefined
        }
      })) || []
  }

  console.log(seatDetail, error)
}

async function testGetSeatsStatus() {
  const user = await signIn(outsider, password)
  const beginTime = new Date()
  const now = new Date() // 取得當前時間
  const endTime = new Date(now) // 創建一個新的 Date 物件，以當前時間為基礎
  endTime.setHours(23, 59, 59)

  console.log(beginTime.toLocaleString(), endTime.toLocaleString())

  const { data: seatInfo, error: getSeatsError } = await supabase.from('seats').select('*')
  console.log(seatInfo, getSeatsError)

  const seatData: { [key: number]: Type.SeatData } = {}

  if (seatInfo == null) return

  seatInfo.forEach((seat: any) => {
    seatData[seat.id] = {
      id: seat.id,
      available: seat.available,
      status: seat.available ? 'available' : 'unavailable', // 初始化狀態
      otherInfo: seat.other_info
    }
  })

  const { data: reservationsData, error: getActiveReservationError } = await supabase
    .from('active_seat_reservations')
    .select('*')
    .gte('begin_time', beginTime.toLocaleString())
    .lt('end_time', endTime.toLocaleString())

  console.log(reservationsData, getActiveReservationError)

  reservationsData?.forEach((reservation: any) => {
    if (reservation.beginTime <= now && reservation.endTime > now) {
      seatData[reservation.seat_id].status = 'reserved'
    } else {
      seatData[reservation.seat_id].status = 'partiallyReserved'
    }
  })

  console.log(seatData)
}

// await testGetSeatStatusUser()
// await testGetSeatStatusAdmin()

await testGetSeatsStatus()
