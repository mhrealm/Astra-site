<template>
  <main class="hover-navbar-page">
    <nav ref="navRef" class="hover-highlight-nav">
      <div class="menu-bg" :style="dynamicStyles"></div>
      <ul class="menu-list">
        <li v-for="item in menuList" :key="item" class="menu-item" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
          <span class="menu-label">{{ item }}</span>
        </li>
      </ul>
    </nav>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, type CSSProperties } from 'vue'

const menuList = ['$CTRL', 'Support', 'Security', 'Resources']
const navRef = ref<HTMLElement | null>(null)

const highlightRect = ref({
  width: 0,
  height: 0,
  left: 0,
  top: 0,
  opacity: 0,
})

const dynamicStyles = computed<CSSProperties>(() => ({
  width: `${highlightRect.value.width}px`,
  height: `${highlightRect.value.height}px`,
  left: `${highlightRect.value.left}px`,
  top: `${highlightRect.value.top}px`,
  opacity: highlightRect.value.opacity,
}))

const getMenuLabel = (event: MouseEvent) => {
  const target = event.currentTarget

  if (!(target instanceof HTMLElement)) {
    return null
  }

  const label = target.querySelector('.menu-label')

  return label instanceof HTMLElement ? label : null
}

const getRelativeRect = (target: HTMLElement) => {
  const navRect = navRef.value?.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()

  if (!navRect) {
    return null
  }

  return {
    width: targetRect.width,
    height: targetRect.height,
    left: targetRect.left - navRect.left,
    top: targetRect.top - navRect.top,
  }
}

const handleMouseEnter = (event: MouseEvent) => {
  const label = getMenuLabel(event)
  const rect = label ? getRelativeRect(label) : null

  if (!rect) {
    return
  }

  highlightRect.value = {
    ...rect,
    opacity: 1,
  }
}

const handleMouseLeave = (event: MouseEvent) => {
  const label = getMenuLabel(event)
  const rect = label ? getRelativeRect(label) : null

  if (!rect) {
    highlightRect.value.opacity = 0
    return
  }

  highlightRect.value = {
    width: 0,
    height: 0,
    left: rect.left + rect.width / 2,
    top: rect.top + rect.height / 2,
    opacity: 0,
  }
}
</script>

<style lang="less" scoped>
.hover-navbar-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: #f6f7f2;
}

.hover-highlight-nav {
  position: relative;
}

.menu-bg {
  position: absolute;
  z-index: 1;
  border-radius: 999px;
  background-color: #d1d6d2;
  pointer-events: none;
  transition: all 0.4s ease;
}

.menu-list {
  position: relative;
  display: inline-flex;
  margin: 0;
  padding: clamp(6px, 0.8vw, 14px);
  list-style: none;
  border-radius: clamp(14px, 1vw, 20px);
  background-color: #ecefec;
}

.menu-item {
  padding: clamp(6px, 0.7vw, 14px);
  color: #202520;
  font-size: clamp(16px, 1.8vw, 32px);
  line-height: 1;
  cursor: pointer;
}

.menu-label {
  position: relative;
  z-index: 2;
  display: block;
  padding: clamp(10px, 1vw, 18px) clamp(24px, 3vw, 56px);
  border-radius: 999px;
}

.menu-item:not(:last-of-type) .menu-label::after {
  content: '';
  position: absolute;
  top: 50%;
  right: clamp(-12px, -1vw, -6px);
  width: 4px;
  height: 50%;
  background-color: rgb(117, 116, 116);
  transform: translateY(-50%);
}

@media (max-width: 720px) {
  .hover-navbar-page {
    align-items: flex-start;
  }

  .menu-list {
    display: flex;
    width: min(100%, 360px);
    flex-direction: column;
  }

  .menu-label {
    padding-right: 28px;
    padding-left: 28px;
  }

  .menu-item:not(:last-of-type) .menu-label::after {
    right: auto;
    bottom: -8px;
    left: 50%;
    top: auto;
    width: 50%;
    height: 2px;
    transform: translateX(-50%);
  }
}
</style>

<route lang="json">{
  "meta": {
    "title": "Hover 高亮导航",
    "category": "交互组件",
    "tag": "导航",
    "difficulty": 3
  }
}</route>
