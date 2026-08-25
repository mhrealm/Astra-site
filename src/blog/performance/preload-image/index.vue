<template>
  <main class="preload-page">
    <section class="preload-shell">
      <header class="preload-header">
        <div>
          <p>Performance / Preload Image</p>
          <h1>图片预加载</h1>
        </div>
        <button type="button" :disabled="loading" @click="preloadImages">
          {{ loading ? '预加载中' : '重新预加载' }}
        </button>
      </header>

      <div class="preload-progress" aria-label="图片预加载进度">
        <span :style="{ width: `${progress}%` }"></span>
      </div>
      <p class="preload-status">{{ loadedCount }} / {{ imageList.length }} loaded</p>

      <ul class="preload-grid" :class="{ 'is-loading': loading }">
        <li v-for="image in imageList" :key="image">
          <img v-if="!loading" :src="image" alt="预加载完成的图片" />
          <div v-else class="preload-placeholder"></div>
        </li>
      </ul>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const imageList = Array.from(
  { length: 12 },
  (_, index) => `https://robohash.org/preload-demo-${index + 1}.png?set=set4&size=360x360`,
)

const loading = ref(false)
const loadedCount = ref(0)
let requestId = 0

const progress = computed(() => Math.round((loadedCount.value / imageList.length) * 100))

const loadImage = (src: string, currentRequestId: number) => {
  return new Promise<void>(resolve => {
    const image = new Image()

    image.onload = () => {
      if (currentRequestId === requestId) {
        loadedCount.value += 1
      }
      resolve()
    }

    image.onerror = () => {
      if (currentRequestId === requestId) {
        loadedCount.value += 1
      }
      resolve()
    }

    image.src = src
  })
}

const preloadImages = async () => {
  requestId += 1
  const currentRequestId = requestId

  loading.value = true
  loadedCount.value = 0

  await Promise.all(imageList.map(src => loadImage(src, currentRequestId)))

  if (currentRequestId === requestId) {
    loading.value = false
  }
}

onMounted(preloadImages)

onBeforeUnmount(() => {
  requestId += 1
})
</script>

<style scoped>
.preload-page {
  min-height: 100vh;
  padding: 32px;
  background: #f5f7fb;
  color: #172033;
}

.preload-shell {
  max-width: 980px;
  margin: 0 auto;
  border: 1px solid #d9e2ef;
  border-radius: 8px;
  background: #fff;
  padding: 24px;
  box-shadow: 0 18px 40px rgb(33 56 96 / 10%);
}

.preload-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.preload-header p,
.preload-header h1,
.preload-status {
  margin: 0;
}

.preload-header p {
  color: #64748b;
  font-size: 13px;
}

.preload-header h1 {
  margin-top: 6px;
  font-size: 26px;
}

.preload-header button {
  border: 0;
  border-radius: 6px;
  background: #2563eb;
  padding: 10px 16px;
  color: #fff;
  cursor: pointer;
}

.preload-header button:disabled {
  cursor: not-allowed;
  opacity: 0.72;
}

.preload-progress {
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: #e2e8f0;
}

.preload-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #2563eb, #0f766e);
  transition: width 0.24s ease;
}

.preload-status {
  margin-top: 8px;
  color: #64748b;
  font-size: 13px;
}

.preload-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 14px;
  margin: 20px 0 0;
  padding: 0;
  list-style: none;
}

.preload-grid li {
  aspect-ratio: 1;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.preload-grid img,
.preload-placeholder {
  width: 100%;
  height: 100%;
}

.preload-grid img {
  display: block;
  object-fit: cover;
}

.preload-placeholder {
  background: repeating-linear-gradient(135deg, #edf2f7 0, #edf2f7 12px, #f8fafc 12px, #f8fafc 24px);
}

.preload-grid.is-loading li {
  opacity: 0.86;
}

@media (max-width: 640px) {
  .preload-page {
    padding: 16px;
  }

  .preload-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>

<route lang="json">{
  "meta": {
    "title": "图片预加载",
    "category": "性能优化",
    "tag": "Preload",
    "difficulty": 3
  }
}</route>
