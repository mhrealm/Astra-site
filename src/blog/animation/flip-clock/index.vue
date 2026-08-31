<template>
  <main class="flip-clock-page">
    <section class="flip-clock-card">
      <header class="clock-header">
        <div>
          <p>Animation / Clock</p>
          <h1>翻页时钟</h1>
        </div>
        <span>{{ todayText }}</span>
      </header>

      <div class="clock-face" aria-label="当前时间">
        <template v-for="(digit, index) in currentDigits" :key="`${index}-${digit}`">
          <span v-if="digit === ':'" class="clock-separator">:</span>
          <span v-else class="flip-digit" :class="{ 'is-flipping': flippingIndexes.has(index) }">
            <span class="digit-half digit-half--top">{{ previousDigits[index] ?? digit }}</span>
            <span class="digit-half digit-half--bottom">{{ digit }}</span>
            <span class="flip-panel flip-panel--front">{{ previousDigits[index] ?? digit }}</span>
            <span class="flip-panel flip-panel--back">{{ digit }}</span>
          </span>
        </template>
      </div>

      <p class="clock-note">每秒比较前后数字，只让变化的数字触发翻页动画。</p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const currentDigits = ref<string[]>([])
const previousDigits = ref<string[]>([])
const flippingIndexes = ref(new Set<number>())
let timer: number | null = null
let flipTimer: number | null = null

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
    .format(date)
    .split('')
}

const todayText = computed(() =>
  new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date()),
)

const updateTime = () => {
  const nextDigits = formatTime(new Date())
  const changed = new Set<number>()

  nextDigits.forEach((digit, index) => {
    if (currentDigits.value[index] && currentDigits.value[index] !== digit) {
      changed.add(index)
    }
  })

  previousDigits.value = currentDigits.value.length ? currentDigits.value : nextDigits
  currentDigits.value = nextDigits
  flippingIndexes.value = changed

  if (flipTimer !== null) {
    window.clearTimeout(flipTimer)
  }

  flipTimer = window.setTimeout(() => {
    flippingIndexes.value = new Set()
    previousDigits.value = currentDigits.value
  }, 680)
}

onMounted(() => {
  updateTime()
  timer = window.setInterval(updateTime, 1000)
})

onBeforeUnmount(() => {
  if (timer !== null) {
    window.clearInterval(timer)
  }

  if (flipTimer !== null) {
    window.clearTimeout(flipTimer)
  }
})
</script>

<style scoped>
.flip-clock-page {
  box-sizing: border-box;
  min-height: 100%;
  padding: 28px;
  color: #1d2129;
}

.flip-clock-card {
  max-width: 920px;
  margin: 0 auto;
  border: 1px solid #e4e6eb;
  border-radius: 8px;
  background: #fff;
  padding: 22px;
  box-shadow: 0 1px 2px rgb(29 33 41 / 4%);
}

.clock-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}

.clock-header p,
.clock-header h1,
.clock-note {
  margin: 0;
}

.clock-header p {
  color: #1e80ff;
  font-size: 13px;
  font-weight: 800;
}

.clock-header h1 {
  margin-top: 6px;
  font-size: 24px;
  line-height: 1.25;
}

.clock-header span {
  border: 1px solid #e4e6eb;
  border-radius: 6px;
  padding: 8px 12px;
  color: #515767;
  font-size: 14px;
  font-weight: 700;
}

.clock-face {
  display: flex;
  flex-wrap: wrap;
  gap: clamp(6px, 1.5vw, 14px);
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 8px;
  background: radial-gradient(circle at top, #263244, #0f172a 58%, #080b12);
  padding: clamp(24px, 6vw, 56px) 18px;
  perspective: 900px;
}

.clock-separator {
  color: #e5e7eb;
  font-size: clamp(38px, 8vw, 78px);
  font-weight: 900;
  line-height: 1;
}

.flip-digit {
  position: relative;
  display: grid;
  width: clamp(42px, 10vw, 96px);
  height: clamp(62px, 14vw, 132px);
  color: #f8fafc;
  font-size: clamp(34px, 8vw, 82px);
  font-weight: 900;
  line-height: 1;
  text-align: center;
  transform-style: preserve-3d;
}

.digit-half,
.flip-panel {
  position: absolute;
  right: 0;
  left: 0;
  display: flex;
  overflow: hidden;
  height: 50%;
  justify-content: center;
  background: linear-gradient(180deg, #1f2937, #111827);
}

.digit-half--top {
  top: 0;
  align-items: flex-end;
  border-radius: 8px 8px 0 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.digit-half--bottom {
  bottom: 0;
  align-items: flex-start;
  border-radius: 0 0 8px 8px;
  color: #dbeafe;
}

.flip-panel {
  z-index: 2;
  backface-visibility: hidden;
}

.flip-panel--front {
  top: 0;
  align-items: flex-end;
  border-radius: 8px 8px 0 0;
  transform-origin: bottom;
}

.flip-panel--back {
  bottom: 0;
  align-items: flex-start;
  border-radius: 0 0 8px 8px;
  color: #dbeafe;
  transform: rotateX(180deg);
  transform-origin: top;
}

.flip-digit.is-flipping .flip-panel--front {
  animation: flip-front 680ms ease-in-out;
}

.flip-digit.is-flipping .flip-panel--back {
  animation: flip-back 680ms ease-in-out;
}

.clock-note {
  margin-top: 16px;
  color: #86909c;
  font-size: 14px;
  text-align: center;
}

@keyframes flip-front {
  0% {
    transform: rotateX(0);
  }

  100% {
    transform: rotateX(-180deg);
  }
}

@keyframes flip-back {
  0% {
    transform: rotateX(180deg);
  }

  100% {
    transform: rotateX(0);
  }
}

@media (max-width: 640px) {
  .flip-clock-page {
    padding: 16px;
  }

  .clock-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
