<template>
  <main ref="pageRef" class="jquery-effects-page">
    <section class="demo-section color-section">
      <h1 class="section-title">随机边框色</h1>
      <button class="demo-button color-button">Change Color</button>
    </section>

    <section class="demo-section zoom-section">
      <h2 class="section-title">图片 Hover 放大</h2>
      <div class="image-frame">
        <img class="zoom-image" src="https://work.herodash.ai/assets/img/chat1-1.png" alt="jQuery hover zoom demo">
      </div>
    </section>

    <section class="demo-section move-section">
      <h2 class="section-title">点击移动元素</h2>
      <div class="move-box">Move</div>
      <div class="move-actions">
        <button class="demo-button move-left">向左移动</button>
        <button class="demo-button move-right">向右移动</button>
      </div>
    </section>

    <section class="demo-section typing-section">
      <h2 class="section-title">打字机效果</h2>
      <div class="typing-text"></div>
      <button class="demo-button typing-button">开始打字</button>
    </section>
  </main>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import $ from 'jquery'

const pageRef = ref(null)
const typingContent = 'Hello, jQuery! This is a typing effect.'

let typingTimer = null

const getRandomColor = () => {
  const r = Math.floor(Math.random() * 256)
  const g = Math.floor(Math.random() * 256)
  const b = Math.floor(Math.random() * 256)

  return `rgb(${r}, ${g}, ${b})`
}

onMounted(() => {
  const $page = $(pageRef.value)
  const $typingText = $page.find('.typing-text')
  const $moveBox = $page.find('.move-box')

  $page.find('.color-button').on('click.jqueryEffects', function () {
    $(this).css({
      borderColor: getRandomColor(),
    })
  })

  $page.find('.zoom-image')
    .on('mouseenter.jqueryEffects', function () {
      $(this).css({
        transform: 'scale(1.18)',
      })
    })
    .on('mouseleave.jqueryEffects', function () {
      $(this).css({
        transform: 'scale(1)',
      })
    })

  $page.find('.move-left').on('click.jqueryEffects', function () {
    $moveBox.stop(true).animate({ left: '-=50px' }, 500)
  })

  $page.find('.move-right').on('click.jqueryEffects', function () {
    $moveBox.stop(true).animate({ left: '+=50px' }, 500)
  })

  $page.find('.typing-button').on('click.jqueryEffects', function () {
    let index = 0

    window.clearTimeout(typingTimer)
    $typingText.text('')

    const typeText = () => {
      if (index >= typingContent.length) {
        return
      }

      $typingText.append(typingContent.charAt(index))
      index += 1
      typingTimer = window.setTimeout(typeText, 100)
    }

    typeText()
  })
})

onBeforeUnmount(() => {
  const $page = $(pageRef.value)

  $page.find('*').off('.jqueryEffects')
  window.clearTimeout(typingTimer)
})
</script>

<style scoped lang="less">
.jquery-effects-page {
  min-height: 100vh;
  padding: 32px;
  color: #2d3436;
  background: #f8faf7;
}

.demo-section {
  min-height: 280px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  border-bottom: 1px solid #dfe7dd;
}

.section-title {
  margin: 0 0 20px;
  font-size: clamp(22px, 2.2vw, 36px);
  font-weight: 600;
}

.demo-button {
  min-width: 120px;
  padding: 10px 18px;
  border: 2px solid #2d3436;
  border-radius: 6px;
  color: #2d3436;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    box-shadow: 0 8px 18px rgba(45, 52, 54, 0.12);
    transform: translateY(-1px);
  }
}

.image-frame {
  width: 88px;
  height: 88px;
  overflow: hidden;
  border-radius: 50%;
  background-color: #6818d0;
}

.zoom-image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  transition: transform 0.25s ease;
}

.move-box {
  position: relative;
  left: 0;
  width: 100px;
  height: 40px;
  border-radius: 10px;
  color: #fff;
  line-height: 40px;
  text-align: center;
  background-color: #6818d0;
}

.move-actions {
  display: flex;
  gap: 12px;
  margin-top: 14px;
}

.typing-text {
  min-height: 34px;
  display: inline-block;
  margin-bottom: 16px;
  border-right: 2px solid #2d3436;
  font-size: 24px;
  white-space: nowrap;
  animation: blink 0.5s step-end infinite;
}

@keyframes blink {

  from,
  to {
    border-color: transparent;
  }

  50% {
    border-color: #2d3436;
  }
}

@media (max-width: 640px) {
  .jquery-effects-page {
    padding: 20px;
  }

  .move-actions {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

<route lang="json">{
  "meta": {
    "title": "jQuery 交互动效",
    "category": "交互组件",
    "tag": "jQuery",
    "difficulty": 2
  }
}</route>
