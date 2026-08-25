<template>
  <main class="canvas-page">
    <section class="canvas-panel">
      <h1 class="canvas-title">Canvas 轨道动画</h1>
      <div class="canvas-stage">
        <canvas ref="canvasRef" class="demo-canvas orbit-canvas" width="300" height="300" />
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let frameId = 0

const drawCircle = (
  context: CanvasRenderingContext2D,
  radius: number,
  innerColor: string,
  outerColor: string,
) => {
  const gradient = context.createRadialGradient(0, 0, 0, 0, 0, radius)
  gradient.addColorStop(0, innerColor)
  gradient.addColorStop(1, outerColor)

  context.beginPath()
  context.arc(0, 0, radius, 0, Math.PI * 2)
  context.fillStyle = gradient
  context.fill()
}

const drawOrbit = () => {
  const canvas = canvasRef.value
  const context = canvas?.getContext('2d')

  if (!canvas || !context) {
    return
  }

  const time = new Date()
  const earthAngle =
    ((2 * Math.PI) / 60) * time.getSeconds() +
    ((2 * Math.PI) / 60000) * time.getMilliseconds()
  const moonAngle =
    ((2 * Math.PI) / 6) * time.getSeconds() +
    ((2 * Math.PI) / 6000) * time.getMilliseconds()

  context.clearRect(0, 0, canvas.width, canvas.height)
  context.save()
  context.translate(150, 150)

  drawCircle(context, 50, '#fff7a8', '#f59e0b')

  context.beginPath()
  context.strokeStyle = 'rgb(0 153 255 / 40%)'
  context.arc(0, 0, 105, 0, Math.PI * 2)
  context.stroke()

  context.save()
  context.rotate(earthAngle)
  context.translate(105, 0)
  drawCircle(context, 10, '#93c5fd', '#2563eb')

  context.save()
  context.rotate(moonAngle)
  context.translate(0, 28.5)
  drawCircle(context, 3, '#f8fafc', '#94a3b8')

  context.restore()
  context.restore()
  context.restore()

  frameId = window.requestAnimationFrame(drawOrbit)
}

onMounted(drawOrbit)

onBeforeUnmount(() => {
  window.cancelAnimationFrame(frameId)
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

.canvas-stage {
  display: flex;
  justify-content: center;
  overflow: hidden;
}

.demo-canvas {
  max-width: 100%;
  border: 4px dashed #cbd5e1;
  border-radius: 8px;
  background-color: #fff;
}

.orbit-canvas {
  border: 0;
  background-color: #000;
}

@media (max-width: 640px) {
  .canvas-page {
    padding: 16px;
  }
}
</style>

<route lang="json">{
  "meta": {
    "title": "Canvas 轨道动画",
    "category": "Canvas 实验",
    "tag": "Canvas",
    "difficulty": 3
  }
}</route>
