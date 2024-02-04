import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'

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
      isSignIn.value = true
      username.value = _username
      toggleDialog()
    }

    function signUp(_username: string, _password: string) {
      isSignIn.value = true
      username.value = _username
      toggleDialog()
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
      signUp,
      toggleDialog,
      dialogStatus
    }
  },
  {
    persist: true
  }
)
