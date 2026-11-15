<template>
  <figure class="demo">
    <div class="stage">
      <video ref="videoA" :class="{ show: isAVisible }" muted playsinline loop></video>
      <video ref="videoB" :class="{ show: !isAVisible }" muted playsinline loop></video>
    </div>

    <figcaption>
      <strong>双 video：双缓冲</strong>
      <span class="is-good">切换时画面不中断</span>
      <span>后台加载新视频，首帧就绪后再交换显示</span>
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

const videoA = useTemplateRef<HTMLVideoElement>('videoA')
const videoB = useTemplateRef<HTMLVideoElement>('videoB')
// 当前显示的是 A 还是 B
const isAVisible = ref(true)

const switchClip = (clipIndex: number) => {
  const visibleVideo = isAVisible.value ? videoA.value! : videoB.value! // 正在显示的
  const standbyVideo = isAVisible.value ? videoB.value! : videoA.value! // 隐藏的后台

  // 只在后台加载，当前显示的保持不动
  standbyVideo.src = clips[clipIndex].src
  // 后台首帧就绪后：播放它、暂停当前显示的、交换显示；重复点击会覆盖上一次的回调
  standbyVideo.onloadeddata = () => {
    standbyVideo.play().catch(() => {})
    visibleVideo.pause()
    isAVisible.value = !isAVisible.value
  }
}

onMounted(() => {
  videoA.value!.src = clips[0].src
  videoA.value!.play().catch(() => {})
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

.is-good {
  color: #047857;
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

.stage video:not(.show) {
  visibility: hidden;
}
</style>
