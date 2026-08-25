<template>
  <main class="canvas-page">
    <section class="canvas-panel">
      <h1 class="canvas-title">Canvas 变形</h1>
      <div class="canvas-stage">
        <canvas ref="canvasRef" class="demo-canvas transform-canvas" width="180" height="180" />
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const drawTransformDemo = () => {
  const canvas = canvasRef.value
  const context = canvas?.getContext('2d')

  if (!canvas || !context) {
    return
  }

  context.clearRect(0, 0, canvas.width, canvas.height)

  context.fillStyle = '#111827'
  context.fillRect(0, 0, 150, 150)
  context.save()

  context.fillStyle = '#0099ff'
  context.fillRect(15, 15, 120, 120)
  context.save()

  context.fillStyle = '#fff'
  context.globalAlpha = 0.5
  context.fillRect(30, 30, 90, 90)

  context.restore()
  context.restore()
}

onMounted(drawTransformDemo)
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

.transform-canvas {
  width: 180px;
  height: 180px;
}

@media (max-width: 640px) {
  .canvas-page {
    padding: 16px;
  }
}
</style>

<route lang="json">{
  "meta": {
    "title": "Canvas 变形",
    "category": "Canvas 实验",
    "tag": "Canvas",
    "difficulty": 2
  }
}</route>
