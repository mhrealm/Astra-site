<template>
  <main class="background-shake-page">
    <section class="shake-demo">
      <div class="scene-toolbar">
        <div>
          <p>Animation / Feedback</p>
          <h1>背景抖动反馈</h1>
        </div>
        <button type="button" :disabled="isShaking" @click="triggerShake">
          {{ isShaking ? '抖动中' : '触发抖动' }}
        </button>
      </div>

      <div
        class="shake-stage"
        :class="{ 'is-shaking': isShaking }"
        :style="{ '--active-scene': activeScene.color }"
      >
        <div
          v-for="scene in scenes"
          :key="scene.name"
          class="scene-layer"
          :class="{ 'scene-layer--active': scene.name === activeScene.name }"
          :style="{ background: scene.background }"
        >
          <span>{{ scene.kicker }}</span>
          <strong>{{ scene.title }}</strong>
        </div>

        <div class="shake-copy">
          <span>Step {{ activeIndex + 1 }} / {{ scenes.length }}</span>
          <h2>{{ activeScene.title }}</h2>
          <p>{{ activeScene.description }}</p>
        </div>
      </div>

      <div class="scene-dots" aria-label="背景场景">
        <button
          v-for="(scene, index) in scenes"
          :key="scene.name"
          type="button"
          :class="{ active: index === activeIndex }"
          :aria-label="`切换到${scene.title}`"
          :aria-pressed="index === activeIndex"
          @click="switchScene(index)"
        ></button>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'

const scenes = [
  {
    name: 'launch',
    kicker: 'Start',
    title: '点击开始',
    description: '按钮触发短促抖动，适合错误提示、冲击反馈或背景转场前的预备动作。',
    color: '#1e80ff',
    background:
      'radial-gradient(circle at 18% 18%, rgba(255,255,255,.9), transparent 18%), linear-gradient(135deg, #175cff 0%, #7c3aed 48%, #111827 100%)',
  },
  {
    name: 'impact',
    kicker: 'Impact',
    title: '切换背景',
    description: '抖动结束后切换到下一张背景，让用户感知当前场景已经发生变化。',
    color: '#f97316',
    background:
      'radial-gradient(circle at 78% 22%, rgba(255,255,255,.88), transparent 16%), linear-gradient(135deg, #fb7185 0%, #f97316 45%, #1f2937 100%)',
  },
]

const activeIndex = ref(0)
const isShaking = ref(false)
let shakeTimer: number | null = null

const activeScene = computed(() => scenes[activeIndex.value]!)

const stopShake = () => {
  if (shakeTimer !== null) {
    window.clearTimeout(shakeTimer)
    shakeTimer = null
  }
}

const switchScene = (index: number) => {
  activeIndex.value = index
}

const triggerShake = () => {
  stopShake()
  isShaking.value = true

  shakeTimer = window.setTimeout(() => {
    activeIndex.value = (activeIndex.value + 1) % scenes.length
    isShaking.value = false
    shakeTimer = null
  }, 520)
}

onBeforeUnmount(stopShake)
</script>

<style scoped>
.background-shake-page {
  box-sizing: border-box;
  min-height: 100%;
  padding: 28px;
  color: #1d2129;
}

.shake-demo {
  max-width: 960px;
  margin: 0 auto;
  border: 1px solid #e4e6eb;
  border-radius: 8px;
  background: #fff;
  padding: 20px;
  box-shadow: 0 1px 2px rgb(29 33 41 / 4%);
}

.scene-toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.scene-toolbar p,
.scene-toolbar h1,
.shake-copy h2,
.shake-copy p {
  margin: 0;
}

.scene-toolbar p {
  color: #1e80ff;
  font-size: 13px;
  font-weight: 800;
}

.scene-toolbar h1 {
  margin-top: 6px;
  font-size: 24px;
  line-height: 1.25;
}

.scene-toolbar button {
  flex: 0 0 auto;
  border: 0;
  border-radius: 6px;
  background: #1e80ff;
  padding: 10px 16px;
  color: #fff;
  font-weight: 800;
  cursor: pointer;
}

.scene-toolbar button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.shake-stage {
  position: relative;
  overflow: hidden;
  min-height: 440px;
  border-radius: 8px;
  background: #111827;
  isolation: isolate;
}

.shake-stage::after {
  position: absolute;
  inset: 18px;
  z-index: 2;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 8px;
  content: '';
  pointer-events: none;
}

.shake-stage.is-shaking {
  animation: background-shake 520ms cubic-bezier(0.36, 0.07, 0.19, 0.97);
}

.scene-layer {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  opacity: 0;
  padding: 42px;
  color: #fff;
  transform: scale(1.04);
  transition:
    opacity 360ms ease,
    transform 520ms ease;
}

.scene-layer--active {
  opacity: 1;
  transform: scale(1);
}

.scene-layer span {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.scene-layer strong {
  margin-top: 8px;
  font-size: clamp(34px, 8vw, 76px);
  line-height: 1;
}

.shake-copy {
  position: absolute;
  right: 28px;
  bottom: 28px;
  z-index: 3;
  width: min(360px, calc(100% - 56px));
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 8px;
  background: rgba(17, 24, 39, 0.66);
  padding: 18px;
  color: #fff;
  backdrop-filter: blur(14px);
}

.shake-copy span {
  color: var(--active-scene);
  font-size: 13px;
  font-weight: 900;
}

.shake-copy h2 {
  margin-top: 8px;
  font-size: 22px;
}

.shake-copy p {
  margin-top: 8px;
  color: rgba(255, 255, 255, 0.78);
  font-size: 14px;
  line-height: 1.7;
}

.scene-dots {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 14px;
}

.scene-dots button {
  width: 30px;
  height: 6px;
  border: 0;
  border-radius: 999px;
  background: #dfe3eb;
  cursor: pointer;
}

.scene-dots button.active {
  background: #1e80ff;
}

@keyframes background-shake {
  10%,
  90% {
    transform: translate3d(-2px, 0, 0);
  }

  20%,
  80% {
    transform: translate3d(4px, 0, 0);
  }

  30%,
  50%,
  70% {
    transform: translate3d(-8px, 0, 0);
  }

  40%,
  60% {
    transform: translate3d(8px, 0, 0);
  }
}

@media (max-width: 640px) {
  .background-shake-page {
    padding: 16px;
  }

  .scene-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .shake-stage {
    min-height: 380px;
  }
}
</style>
