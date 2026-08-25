<template>
  <div class="slide">
    <div class="listDelete">
      <div v-for="item in listData" :key="item.id" class="list-item" @click="resetSwipeState">
        <div class="content-wrapper" :style="{ transform: `translateX(${swipeState[item.id] || 0}px)` }" @touchstart="event => handleTouchStart(event, item.id)" @touchmove="event => handleTouchMove(event, item.id)" @touchend="handleTouchEnd(item.id)">
          <div class="content">
            <div class="message-info">
              <h3 class="name">{{ item.name }}</h3>
              <span class="time">{{ item.time }}</span>
            </div>
            <p class="message">{{ item.message }}</p>
          </div>
        </div>
        <button class="delete-btn" type="button" @click.stop="handleDelete(item.id)">删除</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'

interface MessageItem {
  id: number
  name: string
  message: string
  time: string
}

const listData = ref<MessageItem[]>([
  { id: 1, name: '张三', message: '你好，最近怎么样？', time: '09:30' },
  { id: 2, name: '李四', message: '项目进展顺利吗？', time: '10:15' },
  { id: 3, name: '王五', message: '周末一起吃饭吗？', time: '11:00' },
  { id: 4, name: '赵六', message: '好的，我会尽快处理。', time: '12:30' },
  { id: 5, name: '钱七', message: '谢谢，辛苦了！', time: '14:20' },
])

const swipeState = reactive<Record<number, number>>({})
let startX = 0
let currentSwipeId: number | null = null

const handleTouchStart = (event: TouchEvent, id: number) => {
  startX = event.touches[0]?.clientX ?? 0
  currentSwipeId = id
}

const handleTouchMove = (event: TouchEvent, id: number) => {
  if (id !== currentSwipeId) {
    return
  }

  const currentX = event.touches[0]?.clientX ?? startX
  const diffX = currentX - startX
  const currentPosition = swipeState[id] || 0
  const nextPosition = Math.max(-60, Math.min(currentPosition + diffX, 0))

  swipeState[id] = nextPosition
  startX = currentX
}

const handleTouchEnd = (id: number) => {
  if (id !== currentSwipeId) {
    return
  }

  swipeState[id] = (swipeState[id] || 0) < -30 ? -60 : 0
  currentSwipeId = null
}

const handleDelete = (id: number) => {
  listData.value = listData.value.filter(item => item.id !== id)
  delete swipeState[id]
}

const resetSwipeState = () => {
  Object.keys(swipeState).forEach(id => {
    swipeState[Number(id)] = 0
  })
}
</script>

<style scoped>
.slide {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background-color: #f5f5f5;
}

.listDelete {
  width: 100%;
}

.list-item {
  position: relative;
  width: 100%;
  min-height: 70px;
  margin-bottom: 1px;
  overflow: hidden;
  background-color: #fff;
}

.list-item:active {
  background-color: #f0f0f0;
}

.content-wrapper {
  position: relative;
  z-index: 1;
  display: flex;
  width: 100%;
  min-height: 70px;
  align-items: center;
  background-color: #fff;
  transition: transform 0.3s ease;
}

.content {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  padding: 12px 16px;
}

.message-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.name {
  margin: 0;
  color: #333;
  font-size: 16px;
  font-weight: 500;
}

.time {
  color: #999;
  font-size: 12px;
}

.message {
  margin: 0;
  overflow: hidden;
  color: #666;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-btn {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 0;
  display: flex;
  width: 60px;
  height: 100%;
  align-items: center;
  justify-content: center;
  border: 0;
  background-color: #ff4757;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

.delete-btn:active {
  background-color: #ff3742;
}
</style>

<route lang="json">{
  "meta": {
    "title": "滑动交互",
    "category": "交互组件",
    "tag": "滑动",
    "difficulty": 3
  }
}</route>
