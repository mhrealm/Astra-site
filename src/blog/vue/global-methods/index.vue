<template>
  <div class="flex-gap-column-10">
    <button @click="handleShowToastClick">点击触发全局提示</button>
    <button @click="handleSayHello">点击说hello</button>
    <p v-if="toastMessage" class="toast-message">{{ toastMessage }}</p>
  </div>
</template>

<script setup>
import { getCurrentInstance, inject, ref } from 'vue'

const toastMessage = ref('')
const instance = getCurrentInstance()
const proxy = instance?.proxy
const $sayHello = inject('$sayHello', (name) => {
  window.alert(`hello：${name}`)
})

const handleSayHello = () => {
  $sayHello('张三')
}

const handleShowToastClick = () => {
  const time = new Date(Date.now()).toLocaleString()
  const message = `当前时间：${time}`

  if (proxy?.$showToast) {
    proxy.$showToast(message)
    return
  }

  toastMessage.value = message
}
</script>

<style lang="less" scoped>
.flex-gap-column-10 {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-start;
}

.toast-message {
  margin: 0;
  color: #1e80ff;
  font-size: 14px;
}
</style>

<route lang="json">
{
  "meta": {
    "title": "如何定义全局的方法？",
    "category": "Vue 基础",
    "tag": "基础交互",
    "difficulty": 1
  }
}
</route>
