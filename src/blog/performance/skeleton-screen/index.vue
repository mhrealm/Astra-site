<template>
  <main class="skeleton-page">
    <section class="skeleton-shell">
      <header class="skeleton-header">
        <div>
          <p>Performance / Skeleton</p>
          <h1>骨架屏</h1>
        </div>
        <button type="button" :disabled="loading" @click="reload">
          {{ loading ? '加载中' : '重新加载' }}
        </button>
      </header>

      <ul class="skeleton-list">
        <li v-for="item in cardList" :key="item.id" class="skeleton-item">
          <template v-if="loading">
            <div class="skeleton-avatar skeleton-block"></div>
            <div class="skeleton-copy">
              <span class="skeleton-line skeleton-block"></span>
              <span class="skeleton-line skeleton-line-short skeleton-block"></span>
              <span class="skeleton-line skeleton-line-tiny skeleton-block"></span>
            </div>
          </template>

          <template v-else>
            <img :src="item.avatar" :alt="item.name" />
            <div>
              <h2>{{ item.name }}</h2>
              <p>{{ item.description }}</p>
              <span>{{ item.meta }}</span>
            </div>
          </template>
        </li>
      </ul>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

interface CardItem {
  id: number
  name: string
  description: string
  meta: string
  avatar: string
}

const loading = ref(true)
let timer: number | null = null

const dataList: CardItem[] = [
  {
    id: 1,
    name: '首屏内容加载',
    description: '骨架屏用稳定占位减少白屏感，让用户先感知页面结构。',
    meta: 'layout stable',
    avatar: 'https://robohash.org/skeleton-layout.png?set=set3&size=120x120',
  },
  {
    id: 2,
    name: '接口响应等待',
    description: '真实内容回来后直接替换占位，不改变卡片尺寸。',
    meta: 'async data',
    avatar: 'https://robohash.org/skeleton-data.png?set=set3&size=120x120',
  },
  {
    id: 3,
    name: '列表场景占位',
    description: '列表中重复骨架项可以降低加载阶段的视觉跳动。',
    meta: 'list loading',
    avatar: 'https://robohash.org/skeleton-list.png?set=set3&size=120x120',
  },
]

const placeholderList = Array.from({ length: 3 }, (_, index): CardItem => ({
  id: index + 1,
  name: '',
  description: '',
  meta: '',
  avatar: '',
}))

const cardList = computed<CardItem[]>(() => (loading.value ? placeholderList : dataList))

const reload = () => {
  loading.value = true

  if (timer !== null) {
    window.clearTimeout(timer)
  }

  timer = window.setTimeout(() => {
    loading.value = false
    timer = null
  }, 1400)
}

onMounted(reload)

onBeforeUnmount(() => {
  if (timer !== null) {
    window.clearTimeout(timer)
  }
})
</script>

<style scoped>
.skeleton-page {
  min-height: 100vh;
  padding: 32px;
  background: #f6f8fb;
  color: #172033;
}

.skeleton-shell {
  max-width: 900px;
  margin: 0 auto;
  border: 1px solid #d9e2ef;
  border-radius: 8px;
  background: #fff;
  padding: 24px;
  box-shadow: 0 18px 40px rgb(33 56 96 / 10%);
}

.skeleton-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.skeleton-header p,
.skeleton-header h1 {
  margin: 0;
}

.skeleton-header p {
  color: #64748b;
  font-size: 13px;
}

.skeleton-header h1 {
  margin-top: 6px;
  font-size: 26px;
}

.skeleton-header button {
  border: 0;
  border-radius: 6px;
  background: #0f766e;
  padding: 10px 16px;
  color: #fff;
  cursor: pointer;
}

.skeleton-header button:disabled {
  cursor: not-allowed;
  opacity: 0.72;
}

.skeleton-list {
  display: grid;
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.skeleton-item {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 16px;
  align-items: center;
  min-height: 112px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 18px;
}

.skeleton-item img {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #e2e8f0;
}

.skeleton-item h2 {
  margin: 0 0 8px;
  font-size: 18px;
}

.skeleton-item p {
  margin: 0 0 8px;
  color: #475569;
  line-height: 1.6;
}

.skeleton-item span {
  color: #0f766e;
  font-size: 13px;
}

.skeleton-copy {
  display: grid;
  gap: 12px;
}

.skeleton-block {
  overflow: hidden;
  background: linear-gradient(90deg, #edf2f7 0%, #f8fafc 42%, #edf2f7 78%);
  background-size: 240% 100%;
  animation: skeleton-loading 1.1s ease-in-out infinite;
}

.skeleton-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
}

.skeleton-line {
  display: block;
  width: 100%;
  height: 16px;
  border-radius: 4px;
}

.skeleton-line-short {
  width: 72%;
}

.skeleton-line-tiny {
  width: 38%;
}

@keyframes skeleton-loading {
  0% {
    background-position: 120% 0;
  }

  100% {
    background-position: -120% 0;
  }
}

@media (max-width: 640px) {
  .skeleton-page {
    padding: 16px;
  }

  .skeleton-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>

<route lang="json">{
  "meta": {
    "title": "骨架屏",
    "category": "性能优化",
    "tag": "Skeleton",
    "difficulty": 2
  }
}</route>
