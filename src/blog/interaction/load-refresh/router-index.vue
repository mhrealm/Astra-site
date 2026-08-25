<template>
  <main class="load-refresh-page">
    <section class="load-refresh-panel">
      <h1>上拉加载下拉刷新</h1>
      <nav class="version-links">
        <RouterLink v-for="item in list" :key="item.path" :to="item.path">
          {{ item.title }}
        </RouterLink>
      </nav>
    </section>
  </main>
</template>

<script setup lang="ts">
const list = [
  {
    title: '版本1: 上拉加载下拉刷新',
    path: '/interaction/load-refresh/version-1',
  },
  {
    title: '版本2: 上拉加载',
    path: '/interaction/load-refresh/version-2',
  },
]
</script>

<style scoped>
.load-refresh-page {
  min-height: 100vh;
  padding: 24px;
  background: #f4f6f8;
  color: #111827;
}

.load-refresh-panel {
  max-width: 960px;
  margin: 0 auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  padding: 24px;
}

.load-refresh-panel h1 {
  margin: 0 0 20px;
  font-size: 24px;
  font-weight: 600;
}

.version-links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.version-links a {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 10px 16px;
  color: #111827;
  text-decoration: none;
}

.version-links a:hover {
  border-color: #42b883;
  color: #42b883;
}
</style>

<route lang="json">{
  "meta": {
    "title": "加载与刷新",
    "category": "交互组件",
    "tag": "列表加载",
    "difficulty": 2
  }
}</route>
