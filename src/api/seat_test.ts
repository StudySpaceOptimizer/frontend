import type * as model from './model'
import type { Response } from './common'
import type { Seat } from './index'
import { supabase } from '../service/supabase/supabase'

const student = 'student@mail.ntou.edu.tw'
const bannedstudent = 'bannedstudent@mail.ntou.edu.tw'
const outsider = 'outsider@mail.com'
const admin = 'admin@mail.com'
const password = 'password'

async function signIn(email: string, password: string): Promise<any> {
  let { error: signOut } = await supabase.auth.signOut()
  if (signOut) {
    throw signOut
  }

  let { data: _, error: signIn } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  })

  if (signIn) {
    throw signIn
  }

  let {
    data: { user },
    error: getUser
  } = await supabase.auth.getUser()

  if (getUser) {
    throw getUser
  }

  return user
}

async function testGetSeatStatusAdmin() {
  let user = await signIn(admin, password)

  let seatID = 1

  let { data: active_seat_timeslots, error } = await supabase
    .from('active_seat_reservations')
    .select('*')
    .eq('seat_id', seatID)

  let seatDetail: model.SeatDetail = {
    reservations:
      active_seat_timeslots?.map((seat: any) => ({
        beginTime: new Date(seat.begin_time),
        endTime: new Date(seat.end_time),
        user: undefined // 這裡設為 undefined，假設你沒有權限或無法取得 user 資料
      })) || []
  }

  console.log(active_seat_timeslots, error)
}

await testGetSeatStatusAdmin()
