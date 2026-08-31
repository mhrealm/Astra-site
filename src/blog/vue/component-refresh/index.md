---
title: '怎么实现强制刷新组件？'
description: '对比 key 变化和 v-if 重挂载两种强制刷新组件的方式。'
pubDate: '2024-11-08'
category: 'Vue 基础'
categorySlug: 'vue'
tags: ['基础交互']
difficulty: 2
source: 'vue-practice/src/views/vue/component-refresh/index.vue'
---

> **临时说明**：本文由 AI 根据当前 `index.vue` 和 `Child.vue` 整理，已经补充重渲染与重挂载的区别，但仍不是最终发布版本。

## 先确认你要的是哪一种“刷新”

前端讨论组件刷新时，经常把三件不同的事混在一起：

1. 响应式数据变化，Vue 重新执行渲染并更新必要 DOM。
2. 组件重新渲染，但仍保留原来的组件实例和内部状态。
3. 销毁旧实例，再创建一个全新的组件。

修改 `key` 和切换 `v-if` 实现的是第三种，也就是重挂载。它不只是“重新画一下页面”，而会重新执行 `setup`、挂载钩子和所有初始化逻辑，同时触发旧实例的卸载清理。

因此强制重挂载应该是明确需求，而不是响应式代码没有更新时的通用补丁。

## 演示为什么能看出组件重建

子组件只在初始化时读取一次时间：

```vue
<script setup>
const time = new Date(Date.now()).toLocaleString()
</script>
```

`time` 不是 `ref`，也没有定时器。父组件普通更新不会重新执行这行代码，所以时间保持不变。只有子组件创建新实例时，它才会重新计算。

这让演示能够直观看出“重挂载”，但真实业务中更常见的是重置表单、重建第三方编辑器或重新执行只在 mounted 阶段初始化的 SDK。

## 方式一：改变 key

```vue
<Issues03Child1 :key="childKey" />
```

```ts
const childKey = ref(1)

const refreshByKey = () => {
  childKey.value += 1
}
```

`key` 帮助 Vue 判断前后两棵虚拟 DOM 中的节点是不是同一个身份。key 改变后，即使组件类型没有变化，Vue 也会把它视为旧节点被删除、新节点被创建。

这个方案的优点是意图集中：需要重建哪个组件，就修改它的 key。模板结构不必短暂消失，也不需要手动等待一次更新。

key 应使用稳定且可解释的版本值，不建议随手写 `Math.random()`。随机 key 会让每次父组件渲染都可能重建子组件，导致输入状态丢失和昂贵初始化反复执行。

## 方式二：v-if + nextTick

```ts
const isVisible = ref(true)

const refreshByVisible = async () => {
  isVisible.value = false
  await nextTick()
  isVisible.value = true
}
```

为什么必须等待 `nextTick()`？Vue 会批量处理同一轮同步状态修改。如果连续写 `false` 和 `true`，渲染器最终可能只看到 true，组件从未真正离开 DOM。

等待下一次 DOM 更新后，false 已经提交并触发卸载；再改回 true，才会创建新实例。

这种方式适合业务本来就需要控制组件存在与否的场景。仅为了重建而增加一个 `isVisible`，表达力通常不如 key。

## 重挂载会重置什么

- 子组件中的 `ref/reactive` 状态。
- 未被外部保存的表单输入。
- DOM 滚动位置、选区和焦点。
- mounted 阶段创建的图表、编辑器和监听器。
- keep-alive 之外的组件实例缓存。

卸载时也会执行 `onBeforeUnmount/onUnmounted`。如果子组件没有清理定时器、全局事件和第三方实例，强制刷新会让泄漏更快暴露，而不是自动修复它们。

## 很多场景不应该重挂载

### 只是想重新请求数据

把请求逻辑提取成 `loadData()`，点击时直接调用。重建整个组件会同时丢掉分页、筛选和交互状态。

### 只是想重置表单

维护明确的初始值并提供 `reset()`，或者让父组件重新传入 model。这样可以保留组件实例和焦点策略。

### 子组件没有响应 props 变化

应检查子组件是否错误地把 prop 复制成了不会同步的局部常量。可以使用 computed 或 watch 响应变化，而不是让父组件用 key 掩盖数据流问题。

### 需要调用子组件能力

可以通过 `defineExpose` 暴露小范围命令式方法：

```ts
defineExpose({ reset, reload })
```

这比销毁包含大量内部资源的组件更精确，但暴露方法不宜过多，否则父子耦合会迅速增加。

## forceUpdate 为什么很少需要

Vue 实例提供 `$forceUpdate()`，它会强制当前组件重新渲染，但不会销毁并重建实例，也不会重新执行 setup。它主要用于 Vue 无法追踪的外部可变数据。

Vue 3 的 `ref/reactive` 已能覆盖绝大多数状态。如果经常需要 `$forceUpdate()`，通常说明数据没有正确进入响应式系统。

## 小结

修改 key 和切换 v-if 都能重建组件，但 key 更直接，v-if 更适合显式控制存在时机。使用前先确认你真的需要“新实例”，而不是重新请求数据、同步 props 或重置局部状态。越能准确描述刷新目标，越不需要粗暴地销毁整个组件。
