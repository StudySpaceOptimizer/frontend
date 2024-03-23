<script setup lang="ts">
import { useAccountStore } from '@/stores/account'

const accountStore = useAccountStore()
</script>

<template>
  <header>
    <RouterLink to="/"><p>全興書苑 預約系統</p></RouterLink>
    <div class="wrapper">
      <nav>
        <RouterLink to="/">Home</RouterLink>
      </nav>
    </div>
    <div class="user">
      <template v-if="accountStore.isSignIn">
        <span class="toggle"
          >Hi, {{ accountStore.email == '' ? 'guest' : accountStore.email }}</span
        >
        <div class="dropdown">
          <button @click="accountStore.signOut()">Sign Out</button>
          <RouterLink to="/profile">Profile</RouterLink>
          <RouterLink to="/admin">admin</RouterLink>
        </div>
      </template>
      <template v-else>
        <button @click="accountStore.toggleDialog('signIn')">Sign In</button>
      </template>
    </div>
  </header>
</template>

<style scoped lang="scss">
header {
  display: flex;
  height: 30px;
  padding: 32px 48px;
  align-items: center;
}

p {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0;
}

a {
  text-decoration: none;

  &:visited {
    color: var(--color-text);
  }
}

.wrapper {
  flex: 1;

  nav {
    display: flex;
    justify-content: flex-end;

    a {
      margin: 0 1rem;
      text-decoration: none;
      color: #2024dc;
    }
  }
}

.dropdown {
  position: absolute;
  width: 120px;
  top: 100%;
  right: 0;
  display: none;
  flex-direction: column;
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 0.5rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 1;

  button,
  a {
    padding: 0.5rem 1rem;
    text-align: left;
    text-decoration: none;
    color: #2024dc;
    border: none;
    background-color: transparent;
    cursor: pointer;

    &:hover {
      background-color: #eee;
    }
  }
}

.user {
  position: relative;
  margin-left: 1rem;

  .toggle {
    cursor: pointer;
  }

  &:hover {
    .dropdown {
      display: flex;
    }
  }
}
</style>
