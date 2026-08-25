<template>
  <div class="refresh">
    <div class="list" @scroll="handleScroll">
      <div v-for="item in items" :key="item.id" class="item">
        {{ item.content }}
      </div>
      <div v-if="loading" class="loading">loading...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

interface ListItem {
  id: number
  content: string
}

const pageSize = 10
const pageIndex = ref(1)
const loading = ref(false)
const items = ref<ListItem[]>([])

const fetchData = (index: number, size: number) => {
  return new Promise<ListItem[]>((resolve, reject) => {
    const data: ListItem[] = []

    for (let i = index * size - size; i < index * size; i += 1) {
      data.push({
        id: i,
        content: `${i}我是商品列表元素`,
      })
    }

    window.setTimeout(() => {
      if (data.length >= 10) {
        resolve(data)
      } else {
        reject(new Error('暂无更多数据'))
      }
    }, 1000)
  })
}

const loadPage = async () => {
  if (loading.value) {
    return
  }

  try {
    loading.value = true
    const data = await fetchData(pageIndex.value, pageSize)
    items.value = [...items.value, ...data]
  } catch (error) {
    console.warn(error)
  } finally {
    loading.value = false
  }
}

const handleScroll = (event: Event) => {
  const target = event.currentTarget

  if (!(target instanceof HTMLElement) || loading.value) {
    return
  }

  const reachedBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 1

  if (reachedBottom) {
    pageIndex.value += 1
    loadPage()
  }
}

onMounted(loadPage)
</script>

<style scoped>
.refresh .list {
  height: 50vh;
  margin: 10px;
  overflow: auto;
}

.refresh .item {
  height: 40px;
  margin-bottom: 10px;
  background-color: #ccc;
  color: #fff;
  line-height: 40px;
}

.refresh .loading {
  height: 40px;
  line-height: 40px;
  text-align: center;
}
</style>

<route lang="json">{
  "meta": {
    "title": "滚动加载",
    "category": "交互组件",
    "tag": "列表加载",
    "difficulty": 2
  }
}</route>
