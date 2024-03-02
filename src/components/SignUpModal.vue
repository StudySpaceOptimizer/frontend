<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAccountStore } from '@/stores/account'

const accountStore = useAccountStore()
const identity = ref('student')
const student_form = reactive({
  email: '',
  password: '',
  password_confirm: ''
})
const others_form = reactive({
  name: '',
  telphone: '',
  id: '',
  email: ''
})

const vFocus = {
  mounted: (el: any) => el.focus()
}

const signUp = () => {
  if (identity.value == 'student') {
    if (student_form.password != student_form.password_confirm) {
      alert('密碼不一致')
      return
    }
    
    accountStore.studentSignUp(student_form.email, student_form.password)
  } else {
    accountStore.outsiderSignUp(others_form.name, others_form.telphone, others_form.id, others_form.email)
  }
}
</script>

<template>
  <div class="container" v-if="accountStore.dialogStatus.signUp" @click="accountStore.toggleDialog">
    <form @submit.prevent="signUp" @click.stop="">
      <p>Sign Up</p>
      <div class="button-group">
        <button
          type="button"
          @click="identity = 'student'"
          :class="identity == 'student' ? 'select' : ''"
        >
          學生
        </button>
        <button
          type="button"
          @click="identity = 'others'"
          :class="identity == 'others' ? 'select' : ''"
        >
          校外人士
        </button>
      </div>

      <template v-if="identity == 'student'">
        <label for="name">姓名</label>
        <input type="text" name="name" v-focus />

        <label for="email">信箱</label>
        <input v-model="student_form.email" type="text" name="email" v-focus />
        <label for="email">@mail.ntou.edu.tw</label>

        <label for="password">密碼</label>
        <input v-model="student_form.password" type="password" name="password" />

        <label for="password_confirm">確認密碼</label>
        <input v-model="student_form.password_confirm" type="password" name="password_confirm" />
      </template>
      <template v-else>
        <label for="name">姓名</label>
        <input type="text" name="name" v-focus />

        <label for="telphone">手機</label>
        <input type="text" name="telphone" />

        <label for="id">身分證字號</label>
        <input type="text" name="id" />

        <label for="email">電子郵件</label>
        <input type="text" name="email" />
      </template>
      <input type="submit" value="Sign Up" />

      <p v-if="identity == 'others'">註冊完後需要到圖書館二樓進行驗證</p>

      <p @click="accountStore.toggleDialog('signIn')" style="cursor: pointer">
        已經有帳號了？ Sign In
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

    form button {
      padding: 0.5rem;
      border-radius: 8px;
      background-color: #2033dc;
      color: white;
      border: none;
    }
  }
}

.button-group {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;

  button {
    flex: 1;
    padding: 0.5rem;
    border-radius: 8px;
    background-color: #979797;
    color: white;
    border: none;

    &:first-child {
      margin-right: 0.5rem;
    }

    &.select {
      background-color: #2033dc;
    }
  }
}
</style>
