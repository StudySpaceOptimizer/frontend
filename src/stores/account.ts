import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import * as API from '@/api'

export const useAccountStore = defineStore(
  'account',
  () => {
    const isSignIn = ref(false)
    const name = ref('')
    const userToken = ref('')
    const api = new API.MockUser()

    const dialogStatus = reactive({
      signIn: false,
      signUp: false
    })

    async function signIn(_email: string, _password: string) {
      try {
        const token = await api.signIn(_email, _password);
        const response = await api.getUsers(token, false);
        const data = await response.json();
        toggleDialog();
        isSignIn.value = true;
        userToken.value = token;
        name.value = data[0].name;
      } catch (error) {
        isSignIn.value = false;
        alert("Sign in failed: " + error);
      }
    }    

    function studentSignUp(_name: string, _email: string, _password: string) {
      api.studentSignUp(_name, _email, _password)
        .then((token) => {
          api.sendVerificationEmail(token)
          toggleDialog()
        })
    }

    function outsiderSignUp(_name: string, _phone: string, _idcard: string, _email: string) {
      api.outsiderSignUp(_name, _phone, _idcard, _email)
        .then((token) => {
          api.sendVerificationEmail(token)
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
