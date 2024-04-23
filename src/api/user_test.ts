import type { Response } from './common'
import type { User } from './index'
import { supabase } from '../service/supabase/supabase'
import type * as Type from '@/types'

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

  const settings: Partial<Type.SettingsData> = {}

  data?.forEach((item: any) => {
    switch (item.key_name) {
      case 'weekday_opening_hours':
        settings.weekdayOpeningHours = JSON.parse(item.value)
        break
      case 'weekend_opening_hours':
        settings.weekendOpeningHours = JSON.parse(item.value)
        break
      case 'minimum_reservation_duration':
        settings.minimumReservationDuration = parseFloat(item.value)
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

// await testGrantAdminRoleSuccess()
await testGetSettingData()
