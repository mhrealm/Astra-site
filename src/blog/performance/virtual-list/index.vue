<template>
  <main class="virtual-list-showcase">
    <LazyNormalList />
    <VirtualList />
  </main>
</template>

<script lang="ts" setup>
import LazyNormalList from './LazyNormalList.vue'
import VirtualList from './VirtualList.vue'
</script>

<style lang="less" scoped>
.virtual-list-showcase {
  display: grid;
  gap: 24px;
  margin: 0 auto;
  max-width: 1040px;
  padding: 28px 20px 44px;
}
</style>
