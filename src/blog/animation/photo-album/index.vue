<template>
  <main class="photo-album-page">
    <section class="album-shell">
      <header class="album-header">
        <div>
          <p>Animation / 3D Album</p>
          <h1>立体相册</h1>
        </div>
        <div class="album-actions">
          <button type="button" aria-label="上一张" @click="prevPhoto">‹</button>
          <button type="button" aria-label="下一张" @click="nextPhoto">›</button>
        </div>
      </header>

      <div class="album-stage">
        <ul class="album-track" :style="{ transform: `rotateY(${rotation}deg)` }">
          <li
            v-for="(photo, index) in photos"
            :key="photo.title"
            class="album-card"
            :style="{
              '--card-angle': `${index * angleStep}deg`,
              '--card-bg': photo.background,
            }"
          >
            <span>{{ photo.year }}</span>
            <strong>{{ photo.title }}</strong>
          </li>
        </ul>
      </div>

      <p class="album-note">{{ activePhoto.description }}</p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const photos = [
  {
    title: '海边日落',
    year: '2021',
    description: '每张照片围绕 Y 轴摆放，通过旋转父级轨道切换当前画面。',
    background: 'linear-gradient(135deg, #1e80ff, #8b5cf6 48%, #fb7185)',
  },
  {
    title: '城市灯火',
    year: '2022',
    description: 'CSS 3D 相册的关键是 perspective、transform-style 和 translateZ。',
    background: 'linear-gradient(135deg, #0f172a, #2563eb 46%, #22c55e)',
  },
  {
    title: '山谷晨光',
    year: '2023',
    description: '按钮只修改当前索引，真正的空间位置由 CSS transform 计算。',
    background: 'linear-gradient(135deg, #064e3b, #14b8a6 48%, #facc15)',
  },
  {
    title: '夜色霓虹',
    year: '2024',
    description: '后续换成真实图片时，只需要把背景替换为图片地址即可。',
    background: 'linear-gradient(135deg, #312e81, #db2777 50%, #f97316)',
  },
]

const activeIndex = ref(0)
const angleStep = 360 / photos.length

const rotation = computed(() => -activeIndex.value * angleStep)
const activePhoto = computed(() => photos[activeIndex.value]!)

const prevPhoto = () => {
  activeIndex.value = (activeIndex.value - 1 + photos.length) % photos.length
}

const nextPhoto = () => {
  activeIndex.value = (activeIndex.value + 1) % photos.length
}
</script>

<style scoped>
.photo-album-page {
  box-sizing: border-box;
  min-height: 100%;
  padding: 28px;
  color: #1d2129;
}

.album-shell {
  max-width: 960px;
  margin: 0 auto;
  border: 1px solid #e4e6eb;
  border-radius: 8px;
  background: #fff;
  padding: 22px;
  box-shadow: 0 1px 2px rgb(29 33 41 / 4%);
}

.album-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.album-header p,
.album-header h1,
.album-note {
  margin: 0;
}

.album-header p {
  color: #1e80ff;
  font-size: 13px;
  font-weight: 800;
}

.album-header h1 {
  margin-top: 6px;
  font-size: 24px;
  line-height: 1.25;
}

.album-actions {
  display: flex;
  gap: 10px;
}

.album-actions button {
  width: 38px;
  height: 38px;
  border: 1px solid #e4e6eb;
  border-radius: 50%;
  background: #fff;
  color: #1d2129;
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
}

.album-actions button:hover {
  border-color: #1e80ff;
  color: #1e80ff;
}

.album-stage {
  display: grid;
  min-height: 420px;
  overflow: hidden;
  place-items: center;
  border-radius: 8px;
  background:
    linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px),
    radial-gradient(circle at center, #263244, #0f172a 68%);
  background-size:
    36px 36px,
    36px 36px,
    auto;
  perspective: 1000px;
}

.album-track {
  position: relative;
  width: min(300px, 68vw);
  height: min(390px, 82vw);
  margin: 0;
  padding: 0;
  list-style: none;
  transform-style: preserve-3d;
  transition: transform 620ms cubic-bezier(0.22, 1, 0.36, 1);
}

.album-card {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 8px;
  background: var(--card-bg);
  padding: 24px;
  color: #fff;
  box-shadow: 0 24px 60px rgb(0 0 0 / 24%);
  transform: rotateY(var(--card-angle)) translateZ(360px);
}

.album-card::before {
  position: absolute;
  inset: 18px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 8px;
  content: '';
}

.album-card span,
.album-card strong {
  position: relative;
  z-index: 1;
}

.album-card span {
  font-size: 14px;
  font-weight: 800;
}

.album-card strong {
  margin-top: 8px;
  font-size: 32px;
  line-height: 1.15;
}

.album-note {
  margin-top: 16px;
  color: #515767;
  font-size: 14px;
  line-height: 1.8;
  text-align: center;
}

@media (max-width: 640px) {
  .photo-album-page {
    padding: 16px;
  }

  .album-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .album-card {
    transform: rotateY(var(--card-angle)) translateZ(250px);
  }
}
</style>
