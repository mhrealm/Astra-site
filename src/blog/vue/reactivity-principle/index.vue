<template>
  <section class="mini-reactive-debug">
    <button type="button" @click="incrementDestructureCount">修改 state.num</button>
    <button type="button" @click="updatePropertyName">修改 name</button>
  </section>
</template>

<script setup>
import { effect, reactive } from './mini-reactivity-debug.js'

const destructureState = reactive({ num: 0 })
const { num } = destructureState
const propertyState = reactive({ count: 0, name: 'Vue' })

effect(() => {
  console.log('destructureState.num', destructureState.num) // 收集当前 effect
  // console.log('count', count)
}, 'effectA')

// effect(() => {
//   console.log('destructureState.num', destructureState.num) // 收集当前 effect
//   // console.log('count', count)
// }, 'effectC')

effect(() => {
  console.log('propertyState.name', propertyState.name)
}, 'effectB')

function incrementDestructureCount() {
  destructureState.num += 1
}

function updatePropertyName() {
  propertyState.name = propertyState.name === 'Vue' ? 'Vue 3' : 'Vue'
}
</script>

<style scoped>
.mini-reactive-debug {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  max-width: 760px;
}

button {
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
</style>
