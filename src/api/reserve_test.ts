import { supabase } from '@/service/supabase/supabase'

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

  // 生成預訂資料
  const reservation = {
    beginTime: new Date('2024-04-26T10:00:00'),
    endTime: new Date('2024-04-26T12:00:00'),
    userID: user!.id,
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

await testReserveSuccess()
// await testGetPersonalReservationsSuccess()
// await testDeleteReservationSuccess()
// await testTerminateReservationSuccess()

// const { data, error } = await supabase
//   .from('reservations')
//   .select('*')
//   .eq('id', '20fc4dd0-2d14-4f98-8531-e4afe13926a1')

// console.log(data, error)

// const user = await signIn(admin, password)

// const { data, error } = await supabase
//   .from('reservations')
//   .update({ end_time: new Date() })
//   .eq('id', '4870e1a6-25e2-492e-8867-8afdf1514485')
//   .select()

// console.log(data, error)
