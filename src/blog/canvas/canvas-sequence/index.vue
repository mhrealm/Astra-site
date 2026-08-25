<template>
  <section ref="containerRef" class="canvas-sequence-page">
    <h1 class="sequence-title">Canvas Scroll Sequence</h1>
    <canvas ref="canvasRef" class="sequence-canvas" />
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const containerRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const sequenceState = {
  frame: 0,
}

const frameCount = 147
const canvasWidth = 1158
const canvasHeight = 770
const scrollTriggerId = 'canvas-sequence'

let sequenceTween: gsap.core.Tween | null = null
let firstImage: HTMLImageElement | null = null
let firstImageLoadHandler: (() => void) | null = null

const getFrameUrl = (index: number) => {
  const frameIndex = String(index + 1).padStart(4, '0')

  return `https://www.apple.com/105/media/us/airpods-pro/2019/1299e2f5_9206_4470_b28e_08307a42f19b/anim/sequence/large/01-hero-lightpass/${frameIndex}.jpg`
}

onMounted(() => {
  const canvas = canvasRef.value
  const container = containerRef.value
  const context = canvas?.getContext('2d')

  if (!canvas || !container || !context) {
    return
  }

  canvas.width = canvasWidth
  canvas.height = canvasHeight

  const images = Array.from({ length: frameCount }, (_, index) => {
    const image = new Image()
    image.decoding = 'async'
    image.src = getFrameUrl(index)

    return image
  })

  const render = () => {
    const frameIndex = Math.min(
      frameCount - 1,
      Math.max(0, Math.round(sequenceState.frame)),
    )
    const image = images[frameIndex]

    if (!image || !image.complete || image.naturalWidth === 0) {
      return
    }

    context.clearRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
  }

  const initialImage = images[0]

  if (initialImage) {
    firstImage = initialImage
    firstImageLoadHandler = render
    firstImage.addEventListener('load', firstImageLoadHandler, { once: true })
  }

  sequenceTween = gsap.to(sequenceState, {
    frame: frameCount - 1,
    snap: 'frame',
    ease: 'none',
    scrollTrigger: {
      id: scrollTriggerId,
      trigger: container,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
    },
    onUpdate: render,
  })
})

onBeforeUnmount(() => {
  sequenceTween?.kill()
  ScrollTrigger.getById(scrollTriggerId)?.kill()

  if (firstImage && firstImageLoadHandler) {
    firstImage.removeEventListener('load', firstImageLoadHandler)
  }
})
</script>

<style lang="less" scoped>
.canvas-sequence-page {
  position: relative;
  min-height: 3000px;
  overflow: hidden;
  background: #000;
}

.sequence-title {
  position: sticky;
  top: 20vh;
  z-index: 2;
  margin: 0;
  padding-top: 64px;
  color: #fff;
  font-size: clamp(32px, 4vw, 72px);
  font-weight: 500;
  line-height: 1.1;
  text-align: center;
}

.sequence-canvas {
  position: fixed;
  left: 50%;
  top: 50%;
  max-width: 100vw;
  max-height: 100vh;
  transform: translate(-50%, -50%);
}
</style>

<route lang="json">{
  "meta": {
    "title": "Canvas 序列帧滚动",
    "category": "Canvas 实验",
    "tag": "Canvas",
    "difficulty": 4
  }
}</route>
