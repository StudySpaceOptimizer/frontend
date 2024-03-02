import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import * as api from '@/api'

export const useAccountStore = defineStore(
  'account',
  () => {
    const isSignIn = ref(false)
    const username = ref('')

    const dialogStatus = reactive({
      signIn: false,
      signUp: false
    })

    function signIn(_username: string, _password: string) {
      api.signIn(_username, _password)
        .then(() => {
          isSignIn.value = true
          username.value = _username
          toggleDialog()
        })
        .catch(() => {
          isSignIn.value = false
        })
    }

    function studentSignUp(_username: string, _password: string) {
      api.studentSignUp(_username, _password)
        .then(() => {
          api.sendVerificationEmail(_username)
          toggleDialog()
        })
    }

    function outsiderSignUp(name: string, phone: string, idcard: string, email: string) {
      api.outsiderSignUp(name, phone, idcard, email)
        .then(() => {
          api.sendVerificationEmail(email)
          toggleDialog()
        })
    }

    function signOut() {
      isSignIn.value = false
      toggleDialog()
    }

    function toggleDialog(dialog?: 'signIn' | 'signUp') {
      for (const key in dialogStatus) {
        dialogStatus[key as keyof typeof dialogStatus] = key == dialog
      }
    }

    return {
      isSignIn,
      username,
      signIn,
      signOut,
      studentSignUp,
      outsiderSignUp,
      toggleDialog,
      dialogStatus
    }
  },
  {
    persist: true
  }
)
