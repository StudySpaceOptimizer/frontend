import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import * as api from '@/api'

export const useAccountStore = defineStore(
  'account',
  () => {
    const isSignIn = ref(false)
    const name = ref('')

    const dialogStatus = reactive({
      signIn: false,
      signUp: false
    })

    function signIn(_email: string, _password: string) {
      isSignIn.value = true
      name.value = _email
      toggleDialog()
      // api.signIn(_email, _password)
      //   .then(() => {
      //     isSignIn.value = true
      //     email.value = _email
      //     toggleDialog()
      //   })
      //   .catch(() => {
      //     isSignIn.value = false
      //   })
    }

    function studentSignUp(_name: string, _email: string, _password: string) {
      api.studentSignUp(_name, _email, _password)
        .then(() => {
          api.sendVerificationEmail(_email)
          toggleDialog()
        })
    }

    function outsiderSignUp(_name: string, _phone: string, _idcard: string, _email: string) {
      api.outsiderSignUp(_name, _phone, _idcard, _email)
        .then(() => {
          api.sendVerificationEmail(_email)
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
      email: name,
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
