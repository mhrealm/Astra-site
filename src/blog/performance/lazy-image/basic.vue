<template>
  <div class="image-lazy-loading-case-1">
    <div v-for="(url, index) in imageLists" :key="`${url}-${index}`" class="lazy-img-wrapper">
      <div class="loading-spinner"></div>
      <img :ref="observeImage" class="lazy-img" :data-url="url" :alt="`robot ${index}`" @load="handleImageLoad" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, type ComponentPublicInstance } from 'vue'

const imageLists = ref<string[]>([])
let observer: IntersectionObserver | null = null

const getImageAddress = async () => {
  return Array.from(
    { length: 300 },
    (_, index) => `https://robohash.org/lazy-vue-${index}.png?set=set2&size=400x400`,
  )
}

const initPage = async () => {
  try {
    imageLists.value = await getImageAddress()
  } catch (error) {
    console.error('Error fetching image addresses:', error)
  }
}

const observeImage = (element: Element | ComponentPublicInstance | null) => {
  if (!(element instanceof HTMLImageElement) || !observer) {
    return
  }

  observer.observe(element)
}

const handleImageLoad = (event: Event) => {
  const image = event.currentTarget

  if (!(image instanceof HTMLImageElement)) {
    return
  }

  image.classList.add('loaded')
  image.closest('.lazy-img-wrapper')?.classList.add('img-loaded')
}

onMounted(() => {
  observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting || !(entry.target instanceof HTMLImageElement)) {
          return
        }

        entry.target.src = entry.target.dataset.url || ''
        observer?.unobserve(entry.target)
      })
    },
    {
      rootMargin: '0px 0px -200px 0px',
    },
  )

  initPage()
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>

<style scoped>
.image-lazy-loading-case-1 {
  display: flex;
  flex-wrap: wrap;
  margin: 4rem;
  overflow: auto;
}

.lazy-img-wrapper {
  position: relative;
  width: 40rem;
  height: 40rem;
  margin: 10px;
  overflow: hidden;
  border-radius: 8px;
  background-color: #dbdada;
}

.lazy-img {
  width: 100%;
  opacity: 0;
  object-fit: cover;
  transition: opacity 2s ease;
}

.lazy-img.loaded {
  opacity: 1;
}

.loading-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 50%;
  height: 50%;
  border: 2px solid transparent;
  border-color: #1890ff transparent #1890ff #1890ff;
  border-radius: 50%;
  animation: spin 3s linear infinite;
  transform: translate(-50%, -50%);
}

.img-loaded .loading-spinner {
  opacity: 0;
  pointer-events: none;
  animation: none;
}

@keyframes spin {
  0% {
    transform: translate(-50%, -50%) rotate(0deg);
  }

  100% {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}
</style>
