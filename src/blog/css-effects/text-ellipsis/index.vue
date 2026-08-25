<template>
  <main class="ellipsis-page">
    <section class="ellipsis-container">
      <h1 class="ellipsis-title">文本省略</h1>

      <article class="ellipsis-example">
        <h2>单行文本省略</h2>
        <div class="ellipsis-box">
          <p class="ellipsis-single">{{ longText }}</p>
        </div>
      </article>

      <article class="ellipsis-example">
        <h2>多行文本省略</h2>
        <div class="ellipsis-box">
          <p class="ellipsis-multi">{{ longText.repeat(2) }}</p>
        </div>
      </article>

      <article class="ellipsis-example">
        <h2>固定高度遮罩省略</h2>
        <div class="ellipsis-box">
          <p class="ellipsis-generic">{{ longText.repeat(2) }}</p>
        </div>
      </article>

      <article class="ellipsis-example">
        <h2>JavaScript 截断省略</h2>
        <div class="ellipsis-box">
          <p ref="jsTextRef" class="ellipsis-js">{{ longText.repeat(2) }}</p>
        </div>
      </article>
    </section>
  </main>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const longText =
  '这是一段很长的文本，当容器宽度或高度不足时，会在末尾显示省略号。' +
  '这是一段很长的文本，用来观察不同省略方案在实际布局中的表现。' +
  '这是一段很长的文本，内容继续增加后，容器需要稳定地截断多余部分。'

const jsTextRef = ref<HTMLElement | null>(null)

const truncateText = (element: HTMLElement, maxLines: number) => {
  const originalText = element.dataset.originalText || element.textContent || ''
  const style = window.getComputedStyle(element)
  const lineHeight = Number.parseFloat(style.lineHeight) || Number.parseFloat(style.fontSize) * 1.4
  const maxHeight = lineHeight * maxLines

  element.dataset.originalText = originalText
  element.textContent = originalText

  if (element.scrollHeight <= maxHeight) {
    return
  }

  let start = 0
  let end = originalText.length
  let bestFit = 0

  while (start <= end) {
    const middle = Math.floor((start + end) / 2)
    element.textContent = `${originalText.slice(0, middle)}...`

    if (element.scrollHeight > maxHeight) {
      end = middle - 1
    } else {
      bestFit = middle
      start = middle + 1
    }
  }

  element.textContent = `${originalText.slice(0, Math.max(bestFit, 10))}...`
}

const truncate = () => {
  if (jsTextRef.value) {
    truncateText(jsTextRef.value, 3)
  }
}

onMounted(() => {
  nextTick(truncate)
  window.addEventListener('resize', truncate)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', truncate)
})
</script>

<style scoped>
.ellipsis-page {
  min-height: 100vh;
  padding: 24px;
  background-color: #f5f5f5;
  color: #1f2937;
}

.ellipsis-container {
  max-width: 800px;
  margin: 0 auto;
  border-radius: 8px;
  background-color: #fff;
  padding: 20px;
  box-shadow: 0 2px 4px rgb(0 0 0 / 10%);
}

.ellipsis-title {
  margin: 0 0 20px;
  font-size: 22px;
  font-weight: 600;
}

.ellipsis-example {
  margin-bottom: 30px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 20px;
}

.ellipsis-example h2 {
  margin: 0 0 15px;
  color: #555;
  font-size: 18px;
  font-weight: 600;
}

.ellipsis-box {
  border-radius: 4px;
  background-color: #f9f9f9;
  padding: 10px;
}

.ellipsis-single {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ellipsis-multi {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
}

.ellipsis-generic {
  position: relative;
  height: 4.2em;
  margin: 0;
  overflow: hidden;
  line-height: 1.4;
}

.ellipsis-generic::after {
  position: absolute;
  right: 0;
  bottom: 0;
  background-color: #f9f9f9;
  padding: 0 5px;
  content: '...';
}

.ellipsis-js {
  max-height: 4.2em;
  margin: 0;
  overflow: hidden;
  line-height: 1.4;
}

@media (max-width: 640px) {
  .ellipsis-page {
    padding: 16px;
  }
}
</style>

<route lang="json">{
  "meta": {
    "title": "文本省略",
    "category": "CSS 布局与效果",
    "tag": "文本处理",
    "difficulty": 3
  }
}</route>
