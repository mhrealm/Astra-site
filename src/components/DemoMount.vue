<template>
  <div class="demo-mount">
    <component :is="CurrentDemo" v-if="CurrentDemo" />
    <div v-else class="demo-loading">正在加载演示...</div>
  </div>
</template>

<script lang="ts" setup>
import { markRaw, onMounted, shallowRef } from 'vue'
import type { Component } from 'vue'

const props = defineProps<{
  demoKey: string
}>()

const loaders: Record<string, () => Promise<{ default: Component }>> = {
  'background-shake': () => import('../blog/animation/background-shake/index.vue'),
  'car-basic': () => import('../blog/animation/car-basic/index.vue'),
  'car-interactive': () => import('../blog/animation/car-interactive/index.vue'),
  'flip-clock': () => import('../blog/animation/flip-clock/index.vue'),
  'floor-change': () => import('../blog/animation/floor-change/index.vue'),
  'gsap-basics': () => import('../blog/animation/gsap-basics/index.vue'),
  'photo-album': () => import('../blog/animation/photo-album/index.vue'),
  'basic-shapes': () => import('../blog/canvas/basic-shapes/index.vue'),
  'canvas-sequence': () => import('../blog/canvas/canvas-sequence/index.vue'),
  'orbit-animation': () => import('../blog/canvas/orbit-animation/index.vue'),
  'signature': () => import('../blog/canvas/signature/index.vue'),
  'canvas-transform': () => import('../blog/canvas/canvas-transform/index.vue'),
  'earth-section': () => import('../blog/classic-replica/earth-section/index.vue'),
  'pinned-story': () => import('../blog/classic-replica/pinned-story/index.vue'),
  'qa-session': () => import('../blog/classic-replica/qa-session/index.vue'),
  'blend-mode': () => import('../blog/css-effects/blend-mode/index.vue'),
  'text-ellipsis': () => import('../blog/css-effects/text-ellipsis/index.vue'),
  'hover-navbar': () => import('../blog/interaction/hover-navbar/index.vue'),
  'jquery-effects': () => import('../blog/interaction/jquery-effects/index.vue'),
  'load-refresh': () => import('../blog/interaction/load-refresh/index.vue'),
  'load-refresh-v1': () => import('../blog/interaction/load-refresh/version-1.vue'),
  'load-refresh-v2': () => import('../blog/interaction/load-refresh/version-2.vue'),
  'refresh': () => import('../blog/interaction/refresh/index.vue'),
  'slide': () => import('../blog/interaction/slide/index.vue'),
  'tilt-card': () => import('../blog/interaction/tilt-card/index.vue'),
  'async-delay': () => import('../blog/javascript/async-delay/index.vue'),
  'map-usage': () => import('../blog/javascript/map-usage/index.vue'),
  'lazy-image': () => import('../blog/performance/lazy-image/index.vue'),
  'preload-image': () => import('../blog/performance/preload-image/index.vue'),
  'skeleton-screen': () => import('../blog/performance/skeleton-screen/index.vue'),
  'virtual-list': () => import('../blog/performance/virtual-list/index.vue'),
  'component-refresh': () => import('../blog/vue/component-refresh/index.vue'),
  'global-methods': () => import('../blog/vue/global-methods/index.vue'),
  'keyboard-events': () => import('../blog/vue/keyboard-events/index.vue'),
}

const CurrentDemo = shallowRef<Component | null>(null)

onMounted(async () => {
  const loadDemo = loaders[props.demoKey]

  if (!loadDemo) {
    return
  }

  const module = await loadDemo()
  CurrentDemo.value = markRaw(module.default)
})
</script>

<style scoped>
.demo-mount {
  min-width: 0;
}

.demo-loading {
  display: grid;
  min-height: 180px;
  place-items: center;
  border: 1px solid #e4e6eb;
  border-radius: 6px;
  background: #f7f8fa;
  color: #8a919f;
  font-size: 14px;
}
</style>
