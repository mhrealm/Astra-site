<template>
  <section class="lazy-image-demo">
    <header class="lazy-demo-header">
      <div>
        <p>Vue Demo</p>
        <h2>IntersectionObserver 图片懒加载</h2>
      </div>
      <span>已加载 {{ loadedCount }} / {{ items.length }}</span>
    </header>

    <div ref="gridRef" class="lazy-image-grid">
      <figure
        v-for="item in items"
        :key="item.id"
        class="image-card"
        :class="{ 'is-loaded': item.loaded }"
        :data-lazy-id="item.id"
      >
        <div class="image-placeholder" aria-hidden="true"></div>
        <img
          :src="item.requested ? item.src : undefined"
          :alt="`懒加载机器人 ${item.id}`"
          @load="markLoaded(item.id)"
        />
        <figcaption>#{{ item.id.toString().padStart(2, '0') }}</figcaption>
      </figure>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import './index.less'

interface ImageItem {
  id: number
  src: string
  requested: boolean
  loaded: boolean
}

const createImageItems = (count = 48): ImageItem[] =>
  Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    src: `https://robohash.org/vue-lazy-${index + 1}.png?set=set2&size=420x420`,
    requested: false,
    loaded: false,
  }))

const gridRef = ref<HTMLElement | null>(null)
const items = ref(createImageItems())
const loadedCount = computed(() => items.value.filter((item) => item.loaded).length)

let observer: IntersectionObserver | null = null

const requestImage = (id: number) => {
  const item = items.value.find((currentItem) => currentItem.id === id)

  if (item) {
    item.requested = true
  }
}

const markLoaded = (id: number) => {
  const item = items.value.find((currentItem) => currentItem.id === id)

  if (item) {
    item.loaded = true
  }
}

const observeImages = () => {
  if (!gridRef.value || typeof IntersectionObserver === 'undefined') {
    items.value.forEach((item) => {
      item.requested = true
    })
    return
  }

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return
        }

        const element = entry.target
        const id = Number((element as HTMLElement).dataset.lazyId)

        requestImage(id)
        observer?.unobserve(element)
      })
    },
    {
      rootMargin: '0px 0px 180px 0px',
      threshold: 0.01,
    },
  )

  gridRef.value.querySelectorAll<HTMLElement>('[data-lazy-id]').forEach((element) => {
    observer?.observe(element)
  })
}

onMounted(() => {
  nextTick(observeImages)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>
