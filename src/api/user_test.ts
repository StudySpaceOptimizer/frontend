import { SupabaseUser } from './user'
import { supabase } from '../service/supabase/supabase'
import type * as Types from '@/types'

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

async function testSignUpSuccess(email: string, password: string): Promise<any> {
  const { error } = await supabase.auth.signUp({
    email: email,
    password: password
  })
  if (error) {
    console.log(error)
  }
}

async function testGrantAdminRoleSuccess() {
  //   let user = await signIn(admin, password)

  const { data, error } = await supabase.rpc('set_claim', {
    claim: 'admin_role',
    uid: 'c3f13729-51e2-4a9f-a53c-55c44395fa8a',
    value: 'admin'
  })

  if (error) console.error(error)
  else console.log(data)
}

async function testGetSettingData() {
  const user = await signIn(student, password)

  const { data, error } = await supabase.from('settings').select('*')

  if (error) console.error(error)
  // else console.log(data)

  const settings: Partial<Types.SettingsData> = {}

  data?.forEach((item: any) => {
    switch (item.key_name) {
      case 'weekday_opening_hours':
        settings.weekdayOpeningHours = JSON.parse(item.value)
        break
      case 'weekend_opening_hours':
        settings.weekendOpeningHours = JSON.parse(item.value)
        break
      case 'maximum_reservation_duration':
        settings.maximumReservationDuration = parseInt(item.value, 10)
        break
      case 'student_reservation_limit':
        settings.studentReservationLimit = parseInt(item.value, 10)
        break
      case 'outsider_reservation_limit':
        settings.outsiderReservationLimit = parseInt(item.value, 10)
        break
      case 'points_to_ban_user':
        settings.pointsToBanUser = parseInt(item.value, 10)
        break
      case 'checkin_deadline_minutes':
        settings.checkin_deadline_minutes = parseInt(item.value, 10)
        break
      case 'temporary_leave_deadline_minutes':
        settings.temporary_leave_deadline_minutes = parseInt(item.value, 10)
        break
      case 'check_in_violation_points':
        settings.check_in_violation_points = parseInt(item.value, 10)
        break
      default:
        return
    }
  })

  console.log('Settings loaded:', settings)
}

async function testGetUserByAdmin() {
  // const supabaseUser = new SupabaseUser()
  // const email = 'test_outsider@mail.com'
  // const password = 'password'
  // try {
  //   await supabaseUser.outsiderSignUp(email, password)
  // } catch (e) {
  //   console.log(e)
  // }
}

async function testGetAllUserData() {
  const pageSize = 10,
    pageOffset = 0

  const user = await signIn(admin, password)

  // const userID = '9252cca4-d17e-46bd-bd8c-8f15492e082e'
  const userId = undefined
  const email = undefined
  const userRole = 'student'
  const adminRole = undefined
  const isIn = undefined
  const name = undefined

  const supabaseUser = new SupabaseUser()

  try {
    const result = await supabaseUser.getUserData({
      pageSize,
      pageOffset,
      userId,
      email,
      userRole,
      adminRole,
      isIn,
      name
    })

    console.log(result)
  } catch (e) {
    console.log(e)
  }
}

async function testGetMyUserData() {
  const user = await signIn(admin, password)

  const supabaseUser = new SupabaseUser()

  try {
    const result = await supabaseUser.getMyUserData()

    console.log(result)
  } catch (e) {
    console.log(e)
  }
}
// await testGetAllUserData()

// await testGrantAdminRoleSuccess()
// await testGetSettingData()

// await signIn(admin, password)

// let { data, error } = await supabase.rpc('get_my_claims')
// if (error) console.error(error)
// else console.log(data)

/*
使用supabase UI: user role = 'supabase_admin
使用service_key: current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role'
*/

// const { data, error } = await supabase.auth.admin.createUser({
//   email: 'user@email.com',
//   password: 'password',
//   user_metadata: { name: 'Yoda' },
//   email_confirm: true
// })

// if (error) console.error(error)
// else console.log(data)

// await testGetUserByAdmin()
// await testSignUpSuccess('daasadadds@asd', 'daqwewqes')

// await testGetUserByAdmin()
// await testGetMyUserData()
async function testStudentSignIn() {
  const supabaseUser = new SupabaseUser()
  const email = '00957051@mail.ntou.edu.tw'
  const logInPassword = 'F130999892'

  try {
    // const logIn = await supabaseUser.studentSignIn('test@mail.ntou.edu.tw', 'test')
    const logIn = await supabaseUser.studentSignIn(email, logInPassword)
    console.log(logIn)
  } catch (e) {
    console.log(e)
  }
}

async function testOutsiderSignUp() {
  const supabaseUser = new SupabaseUser()
  const email = 'test@mail.com'
  const name = 'TEST'
  const phone = '0900000000'
  const idCard = 'F111111111'

  try {
    await supabaseUser.outsiderSignUp(name, phone, idCard, email)
  } catch (e) {
    console.log(e)
  }
}

async function testGetOutsiderSignUpData() {
  const supabaseUser = new SupabaseUser()

  try {
    await supabaseUser.getOutsiderSignUpData()
  } catch (e) {
    console.log(e)
  }
}

async function testInsertOutsiderSignUpRequest() {
  const supabaseUser = new SupabaseUser()
  await supabaseUser.signOut()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  console.log(user)

  const { data, error } = await supabase.from('outsider_sign_up_request').insert([
    {
      email: 'test@mail.com',
      name: 'TEST',
      phone: '0900000000',
      id_card: 'F111111111'
    }
  ])

  if (error) console.error(error)
  else console.log(data)
}

// await testStudentSignIn()
await testInsertOutsiderSignUpRequest()
await testGetOutsiderSignUpData()
await testOutsiderSignUp()
