<template>
  <footer>
    <div class="wrapper">
      <p>全興書苑 預約系統</p>
      <p>© 2024 全興書苑</p>
      <!-- TODO: version value to be enviorment variable -->
      <p>version: 2401.1.alpha</p>
    </div>
  </footer>
</template>

<style scoped>
footer {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 5rem;
  background-color: #222222;
  color: white;
}

.wrapper {
  display: flex;
}

.wrapper p {
  margin: 0 0.5rem;
}
</style>
