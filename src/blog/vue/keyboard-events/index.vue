<template>
  <!-- vue如何监听键盘事件？ -->
  <div class="box">
    <input type="text" @keyup.enter="handleEnter" @keydown="handleKeydown" @keydown.ctrl.s="handleSave" placeholder="按回车提交" />
    <div>全局监听键盘事件</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

// 监听特定的按钮
const handleEnter = () => {
  console.log('按下了 Enter！')
}

// 监听所有的键名
const handleKeydown = (e: KeyboardEvent) => {
  console.log('按下的键:', e.key) // 键名（如 "Enter"、"a"）
  console.log('键码:', e.keyCode) // 键码（如 Enter 是 13，已逐渐被废弃）
}

// 监听组合键（修饰符组合）
const handleSave = () => {
  console.log('Ctrl + s 保存')
}

const handleGlobalKeydown = (e: KeyboardEvent) => {
  // 根据按键触发逻辑（示例：监听 ESC 键）
  if (e.key === 'Escape') {
    console.log('全局监听：按下了 ESC 键')
  } else if (e.key === 'Enter') {
    console.log('全局监听：按下了 Enter 键')
  }
}

// 组件挂载时绑定全局事件
onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
})
// 组件卸载时移除事件（关键：避免内存泄漏）
onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<style lang="less"></style>


<route lang="json">{
  "meta": {
    "title": "如何监听键盘事件？",
    "category": "Vue 基础",
    "tag": "基础交互",
    "difficulty": 1
  }
}</route>
