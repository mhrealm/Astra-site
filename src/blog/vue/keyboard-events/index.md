---
title: 'vue 如何监听键盘事件？'
description: '在 vue 中监听键盘事件可以使用 v on 配合键盘事件修饰符实现，常见的键盘事件如 keydown，keyup 等。 1. 监听所有的键盘事件'
pubDate: '2026-08-19'
category: 'Vue 基础'
categorySlug: 'vue'
tags: ['基础交互', 'Vue']
difficulty: 1
source: 'vue-practice/src/views/vue/keyboard-events/index.md'
demoSlug: 'vue-keyboard-events'
demoInline: true
---

在 vue 中监听键盘事件可以使用 v-on 配合键盘事件修饰符实现，常见的键盘事件如 keydown，keyup 等。

1. 监听所有的键盘事件

```vue
<template>
  <!-- 输入框中监听键盘按下事件 -->
  <input @keydown="handleKeydown" placeholder="按下任意键" />
</template>

<script setup>
// 监听所有的键名
const handleKeydown = (e) => {
  console.log('按下的键:', e.key) // 键名（如 "Enter"、"a"）
  console.log('键码:', e.keyCode) // 键码（如 Enter 是 13，已逐渐被废弃）
}
</script>
```

2. 监听特定的键盘事件（配合键盘事件的修饰符实现）

```vue
<template>
  <!-- 按 Enter 键触发 -->
  <input @keydown.enter="handleEnter" placeholder="按 Enter" />
</template>

<script setup>
// 监听特定的按钮
const handleEnter = () => {
  console.log('按下了 Enter！')
}
</script>
```

3. 监听组合键（修饰符组合）

```vue
<template>
  <!-- Ctrl + s 触发 -->
  <input @keydown.ctrl.s="handleSave" placeholder="Ctrl + s" />
</template>

<script setup>
// 监听组合键（修饰符组合）
const handleSave = () => {
  console.log('Ctrl + s 保存')
}
</script>
```

4. 全局监听键盘事件（在整个页面生效）

```vue
<template>
  <div>全局监听键盘事件</div>
</template>

<script setup>
const handleGlobalKeydown = (e) => {
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
```

## 怎么给 vue 定义全局的方法？

在 vue 中定义全局的方式有很多种，这里主要介绍 vue3 中定义全局方法方式。

1. 通过 app.config.globalProperties 挂载全局方法。

```js
// main.js
import { createApp } from 'vue'
import App from './App.vue'
const app = createApp(App)
// 定义全局方法
app.config.globalProperties.$showToast = (message) => {
  alert(`提示：${message}`)
}
app.mount('#app')
```

在组件中使用

```vue
<template>
  <button @click="handleShowToastClick">点击触发全局提示</button>
</template>
<script setup>
import { getCurrentInstance } from 'vue'
// 获取全局方法
const { proxy } = getCurrentInstance()
const handleShowToastClick = () => {
  const time = new Date(Date.now()).toLocaleString()
  proxy.$showToast(`当前时间：${time}`)
}
</script>
```

2. 使用 provide/inject（推荐）

```js
// main.js
import { createApp } from 'vue'
import App from './App.vue'
const app = createApp(App)
// 使用provide 全局注入方法
app.provide('$sayHello', (name) => {
  alert(`hello：${name}`)
})
app.mount('#app')
```

在组件中使用

```vue
<template>
  <button @click="handleSayHello">点击说hello</button>
</template>
<script setup>
import { inject } from 'vue'
const $sayHello = inject('$sayHello')
const handleSayHello = () => {
  $sayHello('张三')
}
</script>
```

3. 通过插件方式定义（推荐用于复用）

如果全局方法较多，可封装为插件，插件方式更适合大型项目，便于管理和按需引入。

注意：上面的 getCurrentInstance 是 Vue 内部 API，官方文档明确指出其主要用于开发 Vue 插件或库，不建议在应用代码中直接使用。

## vue 怎么实现强制刷新组件？

1. 修改组件的 key 属性（最推荐）

Vue 会根据 key 值判断组件是否为 “新组件”：当 key 变化时，组件会被销毁并重新创建（触发完整的生命周期），从而实现强制刷新,简洁高效，不依赖特殊 API，适用于绝大多数场景。

```vue
<template>
  <Issues03Child1 :key="childKey" />
  <button @click="handleRefresh1">通过key值刷新组件1</button>
</template>

<script setup>
import { ref } from 'vue'
let childKey = ref(1)
const handleRefresh1 = () => {
  childKey.value += 1
}
</script>
```

2. 通过 v-if 控制组件销毁与重建

利用 v-if 的特性：当值为 false 时组件被销毁，重新设为 true 时重新创建，实现完全重置。适用场景：需要彻底清空组件状态（如表单重置、数据完全刷新）。

```vue
<template>
  <Issues03Child1 v-if="isVisible" />
  <button @click="handleRefresh2">通过v-if刷新组件1</button>
</template>

<script setup>
import { ref, nextTick } from 'vue'
let childKey = ref(1)
let isVisible = ref(true)

const handleRefresh2 = async () => {
  isVisible.value = false
  await nextTick()
  isVisible.value = true
}
</script>
```

注意事项： 第二种使用 v-if 去强制刷新组件的时候，需要调用 nextTick(),这是由于 vue 对于 DOM 的更新采用的“批量更新”的策略，当响应式数据变化时（比如 isVisible.value = false），Vue 会将 DOM 更新操作放入一个 “队列” 中，等待当前同步代码执行完毕后，再统一处理队列中的更新，最终一次性渲染到 DOM。

这意味着：

1. 执行 isVisible.value = false 后，组件并不会立即被销毁，DOM 也不会立即更新。
2. 如果不等待 DOM 实际更新，直接紧接着执行 isVisible.value = true，Vue 会认为这两次数据变化是 “连续的”，可能会优化掉中间的销毁过程（相当于没变化），导致组件不会重新创建。

## 既生“reactive”,何生“ref”？
