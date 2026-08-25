<template>
  <div class="demo-mount">
    <component :is="CurrentDemo" v-if="CurrentDemo" />
    <div v-else class="demo-loading">正在加载演示...</div>
  </div>
</template>

<script lang="ts" setup>
import { markRaw, onMounted, shallowRef } from 'vue'
import type { Component } from 'vue'

const props = defineProps<{
  componentPath: string
}>()

const loaders = import.meta.glob('../blog/**/*.vue') as Record<
  string,
  () => Promise<{ default: Component }>
>

const CurrentDemo = shallowRef<Component | null>(null)

onMounted(async () => {
  const loadDemo = loaders[props.componentPath]

  if (!loadDemo) {
    return
  }

  const module = await loadDemo()
  CurrentDemo.value = markRaw(module.default)
})
</script>

<style scoped>
.demo-mount {
  height: 100%;
  min-height: 0;
  min-width: 0;
}

.demo-loading {
  display: grid;
  min-height: 180px;
  place-items: center;
  border: 1px solid #e4e6eb;
  border-radius: 6px;
  background: #f7f8fa;
  color: #8a919f;
  font-size: 14px;
}
</style>
