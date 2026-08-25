<template>
  <main class="photo-album-page">
    <section class="photo-album-panel">
      <h1>canvas</h1>
      <a v-for="item in list" :key="item.path" class="album-link" :href="item.path">
        {{ item.title }}
      </a>
    </section>
  </main>
</template>

<script setup lang="ts">
const list = [
  {
    title: '立体相册',
    path: '/animation/photo-album.html',
  },
]
</script>

<style scoped>
.photo-album-page {
  min-height: 100vh;
  padding: 24px;
  background: #f4f6f8;
  color: #111827;
}

.photo-album-panel {
  max-width: 960px;
  margin: 0 auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  padding: 24px;
}

.photo-album-panel h1 {
  margin: 0 0 20px;
  font-size: 24px;
  font-weight: 600;
}

.album-link {
  display: block;
  width: fit-content;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 10px 16px;
  color: #111827;
  text-decoration: none;
}

.album-link:hover {
  border-color: #42b883;
  color: #42b883;
}
</style>

<route lang="json">{
  "meta": {
    "title": "相册动画",
    "category": "动画动效",
    "tag": "3D",
    "difficulty": 3
  }
}</route>
