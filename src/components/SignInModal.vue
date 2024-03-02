<script setup lang="ts">
import { ref } from 'vue'
import { useAccountStore } from '@/stores/account'

const accountStore = useAccountStore()
const username = ref('')
const password = ref('')

const signIn = () => {
  accountStore.signIn(username.value, password.value)
}

const vFocus = {
  mounted: (el: any) => el.focus()
}
</script>

<template>
  <div
    class="container"
    v-if="accountStore.dialogStatus.signIn"
    @click="accountStore.toggleDialog()"
  >
    <form @submit.prevent="signIn()" @click.stop="">
      <p>Sign In</p>

      <label for="username">Username</label>
      <input type="text" name="username" v-model="username" v-focus />

      <label for="password">Password</label>
      <input type="password" name="password" v-model="password" />

      <input type="submit" value="Sign In" />

      <p @click="accountStore.toggleDialog('signUp')" style="cursor: pointer">
        還沒有帳號？ Sign Up
      </p>
    </form>
  </div>
</template>

<style scoped lang="scss">
.container {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;

  form {
    display: flex;
    flex-direction: column;
    padding: 1rem;
    background-color: white;
    border-radius: 8px;

    label {
      margin-bottom: 0.5rem;
    }

    input {
      margin-bottom: 1rem;
    }

    button {
      padding: 0.5rem;
      border-radius: 8px;
      background-color: #2033dc;
      color: white;
      border: none;
    }
  }
}
</style>
