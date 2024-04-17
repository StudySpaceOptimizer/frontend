import type { Response } from './common'
import type { User } from './index'
import { supabase } from '../service/supabase/supabase'
import type * as model from './model'

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

async function testGrantAdminRoleSuccess() {
  //   let user = await signIn(admin, password)

  let { data, error } = await supabase.rpc('set_claim', {
    claim: 'admin_role',
    uid: 'c3f13729-51e2-4a9f-a53c-55c44395fa8a',
    value: 'admin'
  })

  if (error) console.error(error)
  else console.log(data)
}

// await testGrantAdminRoleSuccess()
