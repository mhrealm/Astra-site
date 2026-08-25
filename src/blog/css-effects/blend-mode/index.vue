<template>
  <main class="blend-mode-page">
    <section class="blend-card">
      <h1>混合模式</h1>
      <p>2222</p>
    </section>
  </main>
</template>

<style scoped>
.blend-mode-page {
  display: grid;
  min-height: 100vh;
  place-items: center;
  background: #f4f6f8;
  color: #111827;
}

.blend-card {
  width: min(90vw, 520px);
  border-radius: 8px;
  background: #fff;
  padding: 32px;
  box-shadow: 0 12px 40px rgb(15 23 42 / 12%);
}

.blend-card h1 {
  margin: 0 0 12px;
  font-size: 28px;
}

.blend-card p {
  margin: 0;
  color: #4b5563;
}
</style>

<route lang="json">{
  "meta": {
    "title": "混合模式",
    "category": "CSS 布局与效果",
    "tag": "混合模式",
    "difficulty": 2
  }
}</route>
