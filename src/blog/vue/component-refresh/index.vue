<template>
  <div>
    <Issues03Child1 v-if="isVisible" :key="childKey" />
    <button @click="handleRefresh1">通过key值刷新组件1</button>
    <button @click="handleRefresh2">通过v-if刷新组件1</button>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import Issues03Child1 from './Child.vue'
let childKey = ref(1)
let isVisible = ref(true)
const handleRefresh1 = () => {
  childKey.value += 1
}

const handleRefresh2 = async () => {
  isVisible.value = false
  await nextTick()
  isVisible.value = true
}
</script>
