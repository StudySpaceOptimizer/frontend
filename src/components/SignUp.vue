<script setup lang="ts">
import { ref } from 'vue'
import { useAccountStore } from '@/stores/account'

const accountStore = useAccountStore()
const identity = ref('student')

</script>

<template>
  <div class="container" v-if="accountStore.dialogStatus.signUp" @click="accountStore.toggleDialog">
    
    <form @submit.prevent="" @click.stop="">
      <p>Sign Up</p>
      <div class="button-group">
        <button type="button" @click="identity = 'student'" :class="(identity == 'student' ? 'select' : '')">學生</button>
        <button type="button" @click="identity = 'teacher'" :class="(identity == 'teacher' ? 'select' : '')">教師</button>
      </div>

      <template v-if="identity == 'student'">
        <label for="student_id">學號</label>
        <input type="text" name="student_id" />
  
        <label for="password">密碼</label>
        <input type="password" name="password" />
  
        <label for="password_confirm">確認密碼</label>
        <input type="password" name="password_confirm" />
      </template>
      <template v-else>
        <label for="name" >姓名</label>
        <input type="text" name="name" />
  
        <label for="telphone">手機</label>
        <input type="text" name="telphone" />
  
        <label for="id">身分證字號</label>
        <input type="text" name="id" />
  
        <label for="email">電子郵件</label>
        <input type="text" name="email" />
  
        <p>註冊完後需要到圖書館二樓進行驗證</p>
      </template>
      <input type="submit" value="Sign Up">

      <p @click="accountStore.toggleDialog('signIn')" style="cursor: pointer;">已經有帳號了？</p>
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
  background-color: rgba(0, 0, 0, .5);
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
      margin-bottom: .5rem;
    }

    input {
      margin-bottom: 1rem;
    }

    form button {
      padding: .5rem;
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
    padding: .5rem;
    border-radius: 8px;
    background-color: #979797;
    color: white;
    border: none;
    
    &:first-child {
      margin-right: .5rem;
    }

    &.select {
      background-color: #2033dc;
    }
  }
}
</style>