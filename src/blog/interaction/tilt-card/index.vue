<template>
  <div class="container">
    <div class="card" ref="cardRef" :style="cardStyle" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave">
      <div class="content">
        <span>ANIMATION</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';

const cardRef = ref(null);

// 存储旋转角度
const transform = reactive({
  rotateX: 0,
  rotateY: 0
});

// 计算最终的 CSS 样式
const cardStyle = computed(() => {
  const scale = 1;
  return {
    transform: `rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg)`,
    transition: 'transform 0.5s ease-out'
  };
});

const handleMouseMove = (e) => {
  if (!cardRef.value) return;

  const rect = cardRef.value.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  // 计算鼠标距离中心点的偏移量 (-1 到 1)
  const percentX = (e.clientX - centerX) / (rect.width / 2);
  const percentY = (e.clientY - centerY) / (rect.height / 2);

  console.log(e.clientX, centerX)

  const deg = 25; // 最大旋转角度
  transform.rotateY = percentX * deg;
  transform.rotateX = -percentY * deg; // 取反是因为鼠标向上移动时图片应向下倾斜
};

const handleMouseLeave = () => {
  transform.rotateX = 0;
  transform.rotateY = 0;
};
</script>

<style>
html {
  --base: 1920;
  font-size: clamp(8px, calc(10 / var(--base) * 100vw), 12px);
}
</style>

<style scoped>
.container {
  /* 3D 透视的关键 */
  perspective: 1000px;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100vh;
  background-color: #0f0f0f;
}

.card {
  position: relative;
  width: 320px;
  height: 200px;
  background: linear-gradient(135deg, #6ee7b7, #3b82f6);
  border-radius: 20px;
  transform-style: preserve-3d;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  /* overflow: hidden; */
}

.content {
  font-family: 'Arial Black', sans-serif;
  font-size: 2.5rem;
  color: #000;
  /* 让文字在 3D 空间悬浮 */
  transform: translateZ(50px);
  pointer-events: none;
}
</style>

<route lang="json">{
  "meta": {
    "title": "鼠标跟随倾斜",
    "category": "交互组件",
    "tag": "鼠标交互",
    "difficulty": 3
  }
}</route>
