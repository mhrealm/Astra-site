<template>
  <main class="canvas-page">
    <section class="canvas-panel">
      <h1 class="canvas-title">Canvas 基础图形</h1>
      <div class="canvas-stage">
        <canvas ref="canvasRef" class="demo-canvas" width="500" height="200" />
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const drawShapes = () => {
  const canvas = canvasRef.value
  const context = canvas?.getContext('2d')

  if (!canvas || !context) {
    return
  }

  context.clearRect(0, 0, canvas.width, canvas.height)
  context.lineWidth = 2
  context.strokeStyle = '#111827'

  context.beginPath()
  context.moveTo(25, 25)
  context.lineTo(105, 25)
  context.stroke()

  context.beginPath()
  context.moveTo(150, 25)
  context.lineTo(200, 25)
  context.lineTo(150, 75)
  context.closePath()
  context.stroke()

  context.beginPath()
  context.moveTo(155, 30)
  context.lineTo(185, 30)
  context.lineTo(155, 60)
  context.fillStyle = '#4299e1'
  context.fill()

  context.strokeRect(10, 100, 50, 50)
  context.fillStyle = '#48bb78'
  context.fillRect(15, 105, 40, 40)
  context.clearRect(25, 115, 20, 20)

  context.beginPath()
  context.arc(100, 125, 25, 0, Math.PI * 2)
  context.stroke()

  context.beginPath()
  context.arc(100, 125, 15, 0, Math.PI, true)
  context.stroke()

  context.beginPath()
  context.arc(100, 130, 10, 0, Math.PI)
  context.fillStyle = '#f6ad55'
  context.fill()

  context.beginPath()
  context.arc(170, 125, 25, 0, Math.PI * 2)
  context.stroke()

  context.beginPath()
  context.arc(163, 120, 3, 0, Math.PI * 2)
  context.fillStyle = '#2d3748'
  context.fill()

  context.beginPath()
  context.arc(178, 120, 3, 0, Math.PI * 2)
  context.fill()

  context.beginPath()
  context.arc(170, 123, 18, 0, Math.PI)
  context.stroke()
}

onMounted(drawShapes)
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

@media (max-width: 640px) {
  .canvas-page {
    padding: 16px;
  }
}
</style>

<route lang="json">{
  "meta": {
    "title": "Canvas 基础图形",
    "category": "Canvas 实验",
    "tag": "Canvas",
    "difficulty": 1
  }
}</route>
