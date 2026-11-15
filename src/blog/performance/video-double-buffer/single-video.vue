<template>
  <figure class="demo">
    <div class="stage">
      <video ref="video" muted playsinline loop></video>
      <div v-if="loading" class="mask">加载中…</div>
    </div>

    <figcaption>
      <strong>单 video：直接换 src</strong>
      <span class="is-bad">切换时画面会中断</span>
      <span>同一个 video 既要显示旧画面，又要加载新资源</span>
      <div class="tabs">
        <button
          v-for="(clip, index) in clips"
          :key="clip.src"
          type="button"
          @click="switchClip(index)"
        >
          {{ clip.label }}
        </button>
      </div>
    </figcaption>
  </figure>
</template>

<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from 'vue'
const clips = [
  { label: '日出', src: new URL('./videos/sunrise.mp4', import.meta.url).href },
  { label: '夜景', src: new URL('./videos/city.mp4', import.meta.url).href },
  { label: '极光', src: new URL('./videos/aurora.mp4', import.meta.url).href },
]

const video = useTemplateRef<HTMLVideoElement>('video')
const loading = ref(false)

const play = (src: string) => {
  const el = video.value!
  el.src = src
  el.play().catch(() => {})
}

const switchClip = (index: number) => {
  loading.value = true
  // 直接清空正在显示的 video，旧画面立刻消失
  video.value!.removeAttribute('src')
  video.value!.load()
  play(clips[index].src)
}

onMounted(() => {
  video.value!.addEventListener('playing', () => (loading.value = false))
  play(clips[0].src)
})
</script>

<style scoped>
.demo {
  margin: 0;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.stage {
  position: relative;
  aspect-ratio: 16 / 9;
  background: #000;
}

.stage video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.78);
  color: #fff;
  font-size: 14px;
  letter-spacing: 0.06em;
}

.demo figcaption {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  padding: 12px 14px;
  color: #64748b;
  font-size: 13px;
}

.demo figcaption strong {
  width: 100%;
  color: #172033;
  font-size: 14px;
}

.is-bad {
  color: #b91c1c;
  font-weight: 600;
}

.tabs {
  display: flex;
  gap: 8px;
  width: 100%;
  margin-top: 4px;
}

.tabs button {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  padding: 6px 14px;
  color: #172033;
  font-size: 13px;
  cursor: pointer;
}

.tabs button:hover {
  border-color: #2563eb;
}
</style>
