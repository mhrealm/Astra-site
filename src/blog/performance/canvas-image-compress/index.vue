<template>
  <main class="compress-page">
    <section class="compress-shell">
      <header class="compress-header">
        <p>Performance / Canvas Image Compress</p>
        <h1>Canvas 图片压缩</h1>
      </header>

      <label
        class="compress-dropzone"
        :class="{ 'is-dragging': dragging }"
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop.prevent="handleDrop"
      >
        <input type="file" accept="image/*" @change="handleFileChange" />
        <strong>{{ sourceFile ? sourceFile.name : '点击或拖拽一张图片到这里' }}</strong>
        <span>图片只在浏览器本地处理，不会上传</span>
      </label>

      <div class="compress-controls">
        <label>
          <span>输出格式</span>
          <select v-model="options.type">
            <option value="image/jpeg">JPEG</option>
            <option value="image/webp">WebP</option>
            <option value="image/png">PNG</option>
          </select>
        </label>

        <label>
          <span>最长边</span>
          <select v-model.number="options.maxEdge">
            <option :value="0">保持原尺寸</option>
            <option :value="2560">2560px</option>
            <option :value="1920">1920px</option>
            <option :value="1280">1280px</option>
            <option :value="800">800px</option>
          </select>
        </label>

        <label class="compress-quality" :class="{ 'is-disabled': options.type === 'image/png' }">
          <span>
            质量 {{ options.type === 'image/png' ? '（PNG 无损，忽略此项）' : options.quality }}
          </span>
          <input
            v-model.number="options.quality"
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            :disabled="options.type === 'image/png'"
          />
        </label>
      </div>

      <p v-if="errorMessage" class="compress-message is-error">{{ errorMessage }}</p>
      <p v-else-if="fallbackMessage" class="compress-message">{{ fallbackMessage }}</p>
      <p v-else-if="largerMessage" class="compress-message">{{ largerMessage }}</p>

      <div v-if="sourceFile" class="compress-compare">
        <figure>
          <div class="compress-preview">
            <img v-if="sourceUrl" :src="sourceUrl" alt="原图预览" />
          </div>
          <figcaption>
            <strong>原图</strong>
            <span>{{ formatBytes(sourceFile.size) }}</span>
            <span v-if="result">{{ result.sourceWidth }} × {{ result.sourceHeight }}</span>
            <span>{{ sourceFile.type || '未知类型' }}</span>
          </figcaption>
        </figure>

        <figure>
          <div class="compress-preview">
            <img v-if="resultUrl" :src="resultUrl" alt="压缩后预览" />
            <span v-if="compressing" class="compress-loading">压缩中</span>
          </div>
          <figcaption>
            <strong>压缩后</strong>
            <template v-if="result">
              <span>{{ formatBytes(result.blob.size) }}</span>
              <span>{{ result.width }} × {{ result.height }}</span>
              <span>{{ result.blob.type }}</span>
              <span :class="savedRatio >= 0 ? 'is-saved' : 'is-larger'">
                {{ savedRatio >= 0 ? '减少' : '增加' }} {{ Math.abs(savedRatio * 100).toFixed(1) }}%
              </span>
              <span>耗时 {{ result.duration.toFixed(0) }}ms</span>
            </template>
          </figcaption>
          <a
            v-if="resultUrl && result"
            class="compress-download"
            :href="resultUrl"
            :download="downloadName"
          >
            下载压缩结果
          </a>
        </figure>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, shallowRef, watch } from 'vue'

type OutputType = 'image/jpeg' | 'image/webp' | 'image/png'

interface CompressOptions {
  type: OutputType
  quality: number
  /** 输出图片最长边，0 表示不缩放 */
  maxEdge: number
}

interface CompressResult {
  blob: Blob
  width: number
  height: number
  sourceWidth: number
  sourceHeight: number
  duration: number
}

const typeLabels: Record<string, string> = {
  'image/jpeg': 'JPEG',
  'image/webp': 'WebP',
  'image/png': 'PNG',
}

const typeExtensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/png': 'png',
}

// 按最长边等比缩放，原图本身更小时不放大
const getTargetSize = (width: number, height: number, maxEdge: number) => {
  const longEdge = Math.max(width, height)

  if (!maxEdge || longEdge <= maxEdge) {
    return { width, height }
  }

  const scale = maxEdge / longEdge

  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  }
}

const canvasToBlob = (canvas: HTMLCanvasElement, type: OutputType, quality: number) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('图片导出失败'))),
      type,
      quality,
    )
  })

const compressImage = async (file: File, options: CompressOptions): Promise<CompressResult> => {
  const startTime = performance.now()
  const bitmap = await createImageBitmap(file)
  const sourceWidth = bitmap.width
  const sourceHeight = bitmap.height
  const { width, height } = getTargetSize(sourceWidth, sourceHeight, options.maxEdge)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  try {
    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('当前环境不支持 Canvas 2D')
    }

    // JPEG 没有透明通道，透明区域默认会变成黑色，先铺一层白底
    if (options.type === 'image/jpeg') {
      context.fillStyle = '#fff'
      context.fillRect(0, 0, width, height)
    }

    context.imageSmoothingQuality = 'high'
    context.drawImage(bitmap, 0, 0, width, height)

    const blob = await canvasToBlob(canvas, options.type, options.quality)

    return {
      blob,
      width,
      height,
      sourceWidth,
      sourceHeight,
      duration: performance.now() - startTime,
    }
  } finally {
    bitmap.close()
    // 主动释放画布占用的像素内存
    canvas.width = 0
    canvas.height = 0
  }
}

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

const options = reactive<CompressOptions>({
  type: 'image/jpeg',
  quality: 0.8,
  maxEdge: 1920,
})

const dragging = ref(false)
const sourceFile = shallowRef<File | null>(null)
const sourceUrl = ref('')
const result = shallowRef<CompressResult | null>(null)
const resultUrl = ref('')
const compressing = ref(false)
const errorMessage = ref('')
let requestId = 0

const savedRatio = computed(() => {
  if (!sourceFile.value || !result.value) return 0
  return 1 - result.value.blob.size / sourceFile.value.size
})

const fallbackMessage = computed(() => {
  if (!result.value || result.value.blob.type === options.type) return ''
  return `当前浏览器不支持导出 ${typeLabels[options.type]}，已自动回退为 ${
    typeLabels[result.value.blob.type] ?? result.value.blob.type
  }。`
})

const largerMessage = computed(() => {
  if (!result.value || savedRatio.value >= 0) return ''
  return '压缩结果比原图更大，实际业务中应直接使用原图上传。'
})

const downloadName = computed(() => {
  if (!sourceFile.value || !result.value) return ''
  const baseName = sourceFile.value.name.replace(/\.[^.]+$/, '')
  const extension = typeExtensions[result.value.blob.type] ?? 'img'
  return `${baseName}-compressed.${extension}`
})

const replaceObjectUrl = (currentUrl: string, blob: Blob | null) => {
  if (currentUrl) URL.revokeObjectURL(currentUrl)
  return blob ? URL.createObjectURL(blob) : ''
}

const setSourceFile = (file?: File | null) => {
  if (!file) return

  if (!file.type.startsWith('image/')) {
    errorMessage.value = '请选择图片文件'
    return
  }

  sourceFile.value = file
  sourceUrl.value = replaceObjectUrl(sourceUrl.value, file)
}

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  setSourceFile(input.files?.[0])
  // 允许重复选择同一个文件
  input.value = ''
}

const handleDrop = (event: DragEvent) => {
  dragging.value = false
  setSourceFile(event.dataTransfer?.files[0])
}

const runCompress = async () => {
  const file = sourceFile.value
  if (!file) return

  requestId += 1
  const currentRequestId = requestId

  compressing.value = true
  errorMessage.value = ''

  try {
    const nextResult = await compressImage(file, { ...options })

    // 参数连续变化时，丢弃过期的压缩结果
    if (currentRequestId !== requestId) return

    result.value = nextResult
    resultUrl.value = replaceObjectUrl(resultUrl.value, nextResult.blob)
  } catch (error) {
    if (currentRequestId !== requestId) return

    result.value = null
    resultUrl.value = replaceObjectUrl(resultUrl.value, null)
    errorMessage.value = error instanceof Error ? error.message : '图片压缩失败'
  } finally {
    if (currentRequestId === requestId) {
      compressing.value = false
    }
  }
}

watch([sourceFile, () => ({ ...options })], runCompress)

onBeforeUnmount(() => {
  requestId += 1
  replaceObjectUrl(sourceUrl.value, null)
  replaceObjectUrl(resultUrl.value, null)
})
</script>

<style scoped>
.compress-page {
  min-height: 100vh;
  padding: 32px;
  color: #172033;
}

.compress-shell {
  max-width: 980px;
  margin: 0 auto;
  border: 1px solid #d9e2ef;
  border-radius: 8px;
  background: #fff;
  padding: 24px;
  box-shadow: 0 18px 40px rgb(33 56 96 / 10%);
}

.compress-header p,
.compress-header h1 {
  margin: 0;
}

.compress-header p {
  color: #64748b;
  font-size: 13px;
}

.compress-header h1 {
  margin-top: 6px;
  font-size: 26px;
}

.compress-dropzone {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin-top: 20px;
  border: 2px dashed #bfd0ea;
  border-radius: 8px;
  background: #f8fafc;
  padding: 28px 16px;
  text-align: center;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease;
}

.compress-dropzone:hover,
.compress-dropzone.is-dragging {
  border-color: #2563eb;
  background: #eff6ff;
}

.compress-dropzone input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.compress-dropzone strong {
  font-size: 16px;
  word-break: break-all;
}

.compress-dropzone span {
  color: #64748b;
  font-size: 13px;
}

.compress-controls {
  display: grid;
  grid-template-columns: 160px 160px 1fr;
  gap: 16px;
  margin-top: 18px;
}

.compress-controls label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
  color: #475569;
}

.compress-controls select {
  height: 36px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  padding: 0 10px;
  color: #172033;
}

.compress-quality input {
  height: 36px;
  accent-color: #2563eb;
}

.compress-quality.is-disabled {
  opacity: 0.6;
}

.compress-message {
  margin: 16px 0 0;
  border-radius: 6px;
  background: #fff7ed;
  padding: 10px 12px;
  color: #9a3412;
  font-size: 13px;
}

.compress-message.is-error {
  background: #fef2f2;
  color: #b91c1c;
}

.compress-compare {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.compress-compare figure {
  margin: 0;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.compress-preview {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 260px;
  background: repeating-conic-gradient(#eef2f7 0% 25%, #f8fafc 0% 50%) 0 0 / 20px 20px;
}

.compress-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.compress-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(255 255 255 / 70%);
  color: #2563eb;
  font-size: 14px;
}

.compress-compare figcaption {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  padding: 12px 14px;
  font-size: 13px;
  color: #64748b;
}

.compress-compare figcaption strong {
  width: 100%;
  color: #172033;
  font-size: 14px;
}

.compress-compare .is-saved {
  color: #047857;
  font-weight: 600;
}

.compress-compare .is-larger {
  color: #b91c1c;
  font-weight: 600;
}

.compress-download {
  display: inline-block;
  margin: 0 14px 14px;
  border-radius: 6px;
  background: #2563eb;
  padding: 8px 14px;
  color: #fff;
  font-size: 13px;
  text-decoration: none;
}

@media (max-width: 640px) {
  .compress-page {
    padding: 16px;
  }

  .compress-controls,
  .compress-compare {
    grid-template-columns: 1fr;
  }
}
</style>
