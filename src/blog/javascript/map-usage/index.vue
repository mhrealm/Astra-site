<template>
  <main class="map-usage-page">
    <div class="demo-grid">
      <MapDemo />
      <NormalDemo />
    </div>
    <OrderMerge />
  </main>
</template>

<script setup>
import MapDemo from './MapDemo.vue'
import NormalDemo from './NormalDemo.vue'
import OrderMerge from './OrderMerge.vue'
</script>

<style lang="less" scoped>
.map-usage-page {
  max-width: 1040px;
  padding: 28px 20px 40px;
  color: #1f2937;
}

.demo-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  align-items: stretch;
}

@media (max-width: 780px) {
  .demo-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<route lang="json">{
  "meta": {
    "title": "Map 管理列表选择",
    "category": "JavaScript 实战",
    "tag": "Map",
    "difficulty": 3
  }
}</route>
