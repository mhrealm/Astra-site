<template>
  <section ref="containerRef" class="version version1" @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd">
    <div class="pull-refresh" :style="{ height: `${pullDistance}px`, opacity: pullDistance > 0 ? 1 : 0 }">
      {{ refreshing ? '正在刷新...' : '下拉刷新' }}
    </div>

    <ul>
      <li v-for="item in list" :key="item.title">
        <img :src="item.url" alt="robot" />
        <div class="text">
          <p class="title">{{ item.title }}</p>
          <p class="desc">{{ item.desc }}</p>
        </div>
      </li>
    </ul>

    <div class="load-status">
      {{ loading ? '加载中...' : hasMore ? '上拉加载' : '没有更多了' }}
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

interface RobotItem {
  url: string
  title: string
  desc: string
}

const pageSize = 10
const maxTotal = 100

const list = ref<RobotItem[]>([])
const page = ref(1)
const loading = ref(false)
const hasMore = ref(true)
const refreshing = ref(false)
const pullDistance = ref(0)
const containerRef = ref<HTMLElement | null>(null)

let startY = 0

const fetchListApi = async (pageIndex: number) => {
  await new Promise(resolve => window.setTimeout(resolve, 800))

  const currentTotal = (pageIndex - 1) * pageSize
  const remain = maxTotal - currentTotal
  const length = remain > pageSize ? pageSize : remain

  if (length <= 0) {
    return []
  }

  return Array.from({ length }, (_, index) => ({
    url: `https://robohash.org/${currentTotal + index}.png?set=set4&size=200x200`,
    title: `机器猫 ${currentTotal + index + 1}`,
    desc: `描述 ${currentTotal + index + 1}`,
  }))
}

const onRefresh = async () => {
  if (refreshing.value) {
    return
  }

  refreshing.value = true
  const data = await fetchListApi(1)
  list.value = data
  page.value = 1
  hasMore.value = maxTotal > pageSize
  refreshing.value = false
  pullDistance.value = 0
}

const onLoadMore = async () => {
  if (loading.value || refreshing.value || !hasMore.value) {
    return
  }

  loading.value = true
  const nextPage = page.value + 1
  const data = await fetchListApi(nextPage)

  if (data.length > 0) {
    list.value = [...list.value, ...data]
    page.value = nextPage
    hasMore.value = list.value.length < maxTotal
  } else {
    hasMore.value = false
  }

  loading.value = false
}

const handleScroll = () => {
  const element = containerRef.value

  if (!element) {
    return
  }

  const { scrollTop, scrollHeight, clientHeight } = element

  if (scrollTop + clientHeight >= scrollHeight - 100) {
    onLoadMore()
  }
}

const handleTouchStart = (event: TouchEvent) => {
  const element = containerRef.value

  if (element?.scrollTop === 0) {
    startY = event.touches[0]?.pageY ?? 0
  }
}

const handleTouchMove = (event: TouchEvent) => {
  const element = containerRef.value

  if (!element || element.scrollTop > 0) {
    return
  }

  const diff = (event.touches[0]?.pageY ?? startY) - startY

  if (diff > 0) {
    pullDistance.value = Math.pow(diff, 0.8)
  }
}

const handleTouchEnd = () => {
  if (pullDistance.value > 60) {
    onRefresh()
  } else {
    pullDistance.value = 0
  }
}

onMounted(() => {
  onRefresh()
  containerRef.value?.addEventListener('scroll', handleScroll)
})

onBeforeUnmount(() => {
  containerRef.value?.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.version {
  position: relative;
  height: 100vh;
  overflow: auto;
  background-color: #fff;
}

.pull-refresh {
  display: flex;
  overflow: hidden;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.version ul {
  margin: 0;
  padding: 0;
}

.version li {
  display: flex;
  border-bottom: 1px solid #eee;
  padding: 15px;
  list-style: none;
}

.version li img {
  width: 50px;
  height: 50px;
  margin-right: 15px;
}

.text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 8px;
}

.title {
  margin: 0;
  color: #000;
  font-size: 16px;
  font-weight: 700;
}

.desc {
  margin: 0;
  color: #666;
  font-size: 12px;
}

.load-status {
  padding: 20px;
  color: #999;
  text-align: center;
}
</style>

<route lang="json">{
  "meta": {
    "title": "上拉加载下拉刷新",
    "category": "交互组件",
    "tag": "列表加载",
    "difficulty": 3
  }
}</route>
