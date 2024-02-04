<script setup lang="ts"></script>

<template>
  <form>
    <label for="start">開始時間</label>
    <input type="datetime-local" name="start" id="start" step="1800" />

    <label for="end">結束時間</label>
    <input type="datetime-local" name="end" />

    <input type="button" value="開始篩選" />
  </form>
</template>

<style scoped lang="scss">
form {
  display: flex;
  justify-content: center;
  background-color: gray;
  border-radius: 6px;
  width: 80%;
  padding: 20px;

  label,
  input {
    margin: 0 10px;
    font-size: 1.2em;
  }

  label {
    color: white;
  }
}
</style>
