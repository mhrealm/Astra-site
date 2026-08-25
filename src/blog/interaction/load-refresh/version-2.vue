<template>
  <div class="version">
    <ul ref="containerRef">
      <li v-for="item in robotList" :key="item.title">
        <img :src="item.url" alt="robot" />
        <div class="text">
          <p class="title">{{ item.title }}</p>
          <p class="desc">{{ item.desc }}</p>
        </div>
      </li>
      <li class="load-status">{{ hasMore ? '继续滚动加载' : '没有更多了' }}</li>
    </ul>
  </div>
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

const robotList = ref<RobotItem[]>([])
const hasMore = ref(true)
const loading = ref(false)
const page = ref(1)
const containerRef = ref<HTMLElement | null>(null)

const fetchListApi = async (pageIndex: number) => {
  const currentTotal = (pageIndex - 1) * pageSize

  return Array.from({ length: pageSize }, (_, index) => ({
    url: `https://robohash.org/${currentTotal + index}.png?set=set4&size=200x200`,
    title: `机器猫 ${currentTotal + index + 1}`,
    desc: `描述 ${currentTotal + index + 1}`,
  }))
}

const onLoadMore = async () => {
  if (loading.value || !hasMore.value) {
    return
  }

  loading.value = true
  const data = await fetchListApi(page.value)

  if (data.length > 0) {
    robotList.value = [...robotList.value, ...data]
    page.value += 1
  }

  if (robotList.value.length >= maxTotal) {
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

  if (scrollTop + clientHeight >= scrollHeight - 50) {
    onLoadMore()
  }
}

onMounted(() => {
  onLoadMore()
  containerRef.value?.addEventListener('scroll', handleScroll)
})

onBeforeUnmount(() => {
  containerRef.value?.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.version {
  height: 100vh;
  background-color: #fff;
}

.version ul {
  height: 100vh;
  margin: 0;
  overflow-y: auto;
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
  justify-content: center;
  color: #999;
}
</style>

<route lang="json">{
  "meta": {
    "title": "上拉加载",
    "category": "交互组件",
    "tag": "列表加载",
    "difficulty": 2
  }
}</route>
