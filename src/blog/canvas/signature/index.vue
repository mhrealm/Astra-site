<template>
  <main class="canvas-page">
    <section class="canvas-panel">
      <h1 class="canvas-title">Canvas 电子签名</h1>
      <canvas ref="canvasRef" class="demo-canvas signature-canvas" @pointerdown="startDrawing" @pointermove="draw" @pointerup="stopDrawing" @pointercancel="stopDrawing" @pointerleave="stopDrawing" />
      <div class="canvas-actions">
        <button type="button" @click="clearCanvas">清空</button>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let context: CanvasRenderingContext2D | null = null
let isDrawing = false
let lastPoint = { x: 0, y: 0 }

const resizeCanvas = () => {
  const canvas = canvasRef.value

  if (!canvas) {
    return
  }

  const rect = canvas.getBoundingClientRect()
  const ratio = window.devicePixelRatio || 1
  const snapshot = canvas.width && canvas.height ? canvas.toDataURL() : ''

  canvas.width = Math.floor(rect.width * ratio)
  canvas.height = Math.floor(rect.height * ratio)

  context = canvas.getContext('2d', { willReadFrequently: true })

  if (!context) {
    return
  }

  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  context.lineWidth = 2
  context.lineJoin = 'round'
  context.lineCap = 'round'
  context.strokeStyle = '#111827'

  if (snapshot) {
    const image = new Image()
    image.onload = () => {
      context?.drawImage(image, 0, 0, rect.width, rect.height)
    }
    image.src = snapshot
  }
}

const getPoint = (event: PointerEvent) => {
  const rect = canvasRef.value?.getBoundingClientRect()

  if (!rect) {
    return { x: 0, y: 0 }
  }

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
}

const startDrawing = (event: PointerEvent) => {
  const canvas = canvasRef.value

  if (!canvas) {
    return
  }

  isDrawing = true
  lastPoint = getPoint(event)
  canvas.setPointerCapture(event.pointerId)
}

const draw = (event: PointerEvent) => {
  if (!isDrawing || !context) {
    return
  }

  const point = getPoint(event)

  context.beginPath()
  context.moveTo(lastPoint.x, lastPoint.y)
  context.lineTo(point.x, point.y)
  context.stroke()
  lastPoint = point
}

const stopDrawing = () => {
  isDrawing = false
}

const clearCanvas = () => {
  const canvas = canvasRef.value

  if (!canvas || !context) {
    return
  }

  const rect = canvas.getBoundingClientRect()
  context.clearRect(0, 0, rect.width, rect.height)
}

onMounted(() => {
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCanvas)
})
</script>

<style scoped>
.canvas-page {
  min-height: 100vh;
  padding: 24px;
  background-color: #f4f6f8;
  color: #1f2937;
}

.canvas-panel {
  max-width: 960px;
  margin: 0 auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background-color: #fff;
  padding: 20px;
}

.canvas-title {
  margin: 0 0 16px;
  font-size: 20px;
  font-weight: 600;
}

.demo-canvas {
  max-width: 100%;
  border: 4px dashed #cbd5e1;
  border-radius: 8px;
  background-color: #fff;
}

.signature-canvas {
  width: 100%;
  height: 300px;
  cursor: crosshair;
  touch-action: none;
}

.canvas-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.canvas-actions button {
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background-color: #fff;
  padding: 6px 14px;
  color: #111827;
  cursor: pointer;
}

.canvas-actions button:hover {
  border-color: #42b883;
  color: #42b883;
}

@media (max-width: 640px) {
  .canvas-page {
    padding: 16px;
  }
}
</style>

<route lang="json">{
  "meta": {
    "title": "Canvas 电子签名",
    "category": "Canvas 实验",
    "tag": "Canvas",
    "difficulty": 3
  }
}</route>
