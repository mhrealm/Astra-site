<template>
  <main class="flip-clock-page">
    <section class="flip-clock-card">
      <h1>翻页时钟</h1>
      <p>23332</p>
    </section>
  </main>
</template>

<style scoped>
.flip-clock-page {
  display: grid;
  min-height: 100vh;
  place-items: center;
  background: #f4f6f8;
  color: #111827;
}

.flip-clock-card {
  width: min(90vw, 480px);
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  padding: 32px;
  box-shadow: 0 12px 40px rgb(15 23 42 / 12%);
}

.flip-clock-card h1 {
  margin: 0 0 12px;
  font-size: 28px;
}

.flip-clock-card p {
  margin: 0;
  color: #4b5563;
}
</style>

<route lang="json">{
  "meta": {
    "title": "翻页时钟",
    "category": "动画动效",
    "tag": "时钟动效",
    "difficulty": 3
  }
}</route>
