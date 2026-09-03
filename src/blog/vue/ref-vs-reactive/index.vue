<template>
  <section class="mini-reactive-debug">
    <button type="button" @click="increment">state.count++</button>
  </section>
</template>

<script setup>
import { effect, reactive } from './mini-reactivity-debug.js'
const state = reactive({ count: 0 })
const { count } = state

effect(() => {
  console.log('state.count', state.count) // 收集当前 effect
  console.log('count', count)
})

function increment() {
  state.count += 1
}
</script>

<style scoped>
.mini-reactive-debug {
  display: grid;
  gap: 16px;
  max-width: 760px;
  border: 1px solid #d9e2ef;
  border-radius: 8px;
  background: #ffffff;
  color: #172033;
  padding: 20px;
}

header p,
header h2,
article p {
  margin: 0;
}

header p,
article span {
  color: #1e80ff;
  font-size: 12px;
  font-weight: 800;
}

header h2 {
  margin-top: 6px;
  font-size: 22px;
  line-height: 1.3;
}

.debug-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

article {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #f8fafc;
  padding: 14px;
}

article strong {
  display: block;
  margin-top: 8px;
  color: #0f172a;
  font-family: Consolas, 'Liberation Mono', monospace;
  font-size: 20px;
}

article p {
  margin-top: 8px;
  color: #475569;
  font-size: 13px;
  line-height: 1.6;
}

button {
  justify-self: start;
  min-height: 38px;
  border: 1px solid #1e80ff;
  border-radius: 6px;
  background: #1e80ff;
  color: #ffffff;
  cursor: pointer;
  font: inherit;
  font-size: 14px;
  font-weight: 800;
  padding: 0 14px;
}

button:hover {
  background: #1769d3;
  border-color: #1769d3;
}

@media (max-width: 640px) {
  .debug-grid {
    grid-template-columns: 1fr;
  }
}
</style>
