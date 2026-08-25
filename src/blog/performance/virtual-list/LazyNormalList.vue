<template>
  <section class="lazy-demo">
    <div v-if="!started" class="demo-intro">
      <div>
        <h3>普通列表压力演示</h3>
        <p>默认不自动渲染，避免打开文章时一次性创建大量 DOM。</p>
      </div>
      <div class="demo-actions">
        <button type="button" @click="start(1000)">渲染 1,000 行</button>
        <button type="button" class="danger" @click="start(10000)">渲染 10,000 行</button>
      </div>
    </div>

    <NormalList v-else :total="total" />
  </section>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import NormalList from './NormalList.vue'

const started = ref(false)
const total = ref(1000)

const start = (count: number) => {
  total.value = count
  started.value = true
}
</script>

<style lang="less" scoped>
.lazy-demo {
  margin: 24px 0;
}

.demo-intro {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border: 1px solid #e4e6eb;
  border-radius: 8px;
  background: #fff;
  padding: 20px;
  box-shadow: 0 2px 12px rgb(29 33 41 / 4%);
}

.demo-intro h3,
.demo-intro p {
  margin: 0;
}

.demo-intro h3 {
  color: #1d2129;
  font-size: 20px;
}

.demo-intro p {
  margin-top: 6px;
  color: #8a919f;
  font-size: 14px;
}

.demo-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
}

.demo-actions button {
  border: 1px solid #e4e6eb;
  border-radius: 8px;
  background: #f7f8fa;
  color: #252933;
  cursor: pointer;
  font: inherit;
  font-size: 14px;
  padding: 10px 14px;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    color 0.2s ease;
}

.demo-actions button:hover {
  border-color: #1e80ff;
  background: rgb(30 128 255 / 8%);
  color: #1e80ff;
}

.demo-actions .danger:hover {
  border-color: #f53f3f;
  background: rgb(245 63 63 / 8%);
  color: #f53f3f;
}

@media (max-width: 640px) {
  .demo-intro {
    align-items: flex-start;
    flex-direction: column;
  }

  .demo-actions {
    justify-content: flex-start;
    width: 100%;
  }
}
</style>
