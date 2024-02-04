<script setup lang="ts"></script>

<template>
  <div class="button-group">
    <button>一般</button>
    <button>校內生</button>
    <button>校外人士</button>
  </div>
  <div class="container">
    <form @submit.prevent="">
      <label for="">平日開館</label>
      <input type="text" />
      <label for="">假日開館</label>
      <input type="text" />
      <label for="">單次預約時間上限</label>
      <input type="text" />

      <input type="submit" value="確認" />
    </form>
  </div>
</template>

<style scoped lang="scss">
.button-group {
  display: flex;
  margin: 16px 0;

  button {
    margin: 0 8px;
    padding: 8px 16px;
    border-radius: 6px;
    border: 1px solid #ccc;
    background-color: #fff;
    cursor: pointer;

    &:hover {
      background-color: #ccc;
    }
  }
}

.container {
  position: relative;
  margin-top: 16px;
  height: 500px;
  width: 80%;
  border-radius: 6px;
  background-color: #e8e8e8;

  form {
    display: flex;
    flex-direction: column;
    padding: 1rem;

    label {
      margin: 8px 0;
    }

    input {
      padding: 8px;
      border-radius: 6px;
      border: 1px solid #ccc;
      margin: 12px 0;
    }
  }
}
</style>
