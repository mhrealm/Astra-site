---
title: '骨架屏'
description: '模拟数据加载时的骨架屏占位和内容切换。'
pubDate: '2024-03-12'
category: '性能优化'
categorySlug: 'performance'
tags: ['Skeleton']
difficulty: 2
source: 'vue-practice/src/views/performance/skeleton-screen/index.vue'
---

> **临时说明**：本文由 AI 根据当前 `index.vue` 整理，已经补充感知性能、布局稳定性和加载状态设计，但仍不是最终发布版本。

## 骨架屏不会让接口变快

骨架屏优化的是等待体验，不是网络耗时。它提前展示页面的大致结构，让用户知道内容正在加载，也减少数据回来时整个页面突然重排的感觉。

如果接口本来只需要 100ms，先闪一下骨架屏再显示内容反而更干扰；如果等待超过一秒，结构化占位通常比空白页或居中的转圈更容易让用户保持上下文。

所以骨架屏不是所有 loading 的默认答案，它更适合结构可预测、加载时间有明显波动的内容页和列表页。

## 骨架结构必须接近真实内容

当前卡片的真实结构是头像加三段文本。骨架状态使用相同网格：

```vue
<template v-if="loading">
  <div class="skeleton-avatar skeleton-block"></div>
  <div class="skeleton-copy">
    <span class="skeleton-line skeleton-block"></span>
    <span class="skeleton-line skeleton-line-short skeleton-block"></span>
    <span class="skeleton-line skeleton-line-tiny skeleton-block"></span>
  </div>
</template>
```

头像固定为 `72px`，列表项也设置稳定的最小高度。真实内容替换时，容器尺寸变化较小，能够降低布局偏移。

骨架屏不是越像真实设计越好。做出按钮文字、完整图标和大量细节会增加维护成本，还可能让用户误以为页面已经可操作。保留轮廓与层级即可。

## 占位数据为什么也需要稳定 key

```ts
const placeholderList = Array.from({ length: 3 }, (_, index): CardItem => ({
  id: index + 1,
  name: '',
  description: '',
  meta: '',
  avatar: '',
}))
```

模板继续使用 `v-for` 渲染，并以 `id` 作为 key。占位项与真实项数量相同时，列表外部结构更稳定。

不过当前模板在每个 `<li>` 内用 `v-if` 切换两套子树，真实内容到来时仍会替换内部 DOM。对于复杂卡片，也可以保留同一结构，仅通过 class 控制内容和骨架层的可见性，但必须避免隐藏内容仍可被聚焦。

## loading 不是唯一状态

示例用布尔值说明最小流程：

```ts
const cardList = computed(() => (loading.value ? placeholderList : dataList))
```

真实接口至少还要区分：

- `idle`：尚未开始请求。
- `loading`：首次加载，没有可展示内容。
- `success`：加载成功。
- `empty`：请求成功但数据为空。
- `error`：请求失败，可重试。
- `refreshing`：已有旧内容，正在后台刷新。

后台刷新时通常保留旧内容并给出轻量提示，不应重新覆盖整页骨架，否则用户正在阅读的内容会突然消失。

## 流光动画的原理

```css
.skeleton-block {
  background: linear-gradient(90deg, #edf2f7 0%, #f8fafc 42%, #edf2f7 78%);
  background-size: 240% 100%;
  animation: skeleton-loading 1.1s ease-in-out infinite;
}
```

渐变背景比元素本身更宽，通过改变 `background-position` 让亮色带横向经过。它提供“仍在进行”的感觉，但不会让数据更快出现。

连续动画会消耗合成与绘制资源。列表很长时，不要为屏幕外几十个骨架项同时播放动画。还应提供减少动态效果的回退：

```css
@media (prefers-reduced-motion: reduce) {
  .skeleton-block {
    animation: none;
  }
}
```

## 避免骨架屏闪烁

可以延迟约 `150~250ms` 再显示骨架：接口快速返回时直接展示内容，超过阈值才进入骨架状态。显示后也可以保证一个很短的最小停留时间，避免刚出现就消失。

这两个阈值不能设置得太大，否则用户会先看到空白，再看到骨架。应结合真实接口分布和用户设备数据调整，而不是凭感觉写一个两秒 setTimeout。

## 可访问性

骨架形状是装饰内容，应避免被屏幕阅读器逐个朗读，可以给骨架容器设置 `aria-hidden="true"`。承载数据的区域可以使用：

```vue
<section :aria-busy="loading">
```

如果加载结果非常重要，可以准备一段视觉隐藏的状态文本，但不要让每个动画循环都触发播报。加载失败和空状态必须有明确文本，不能只通过骨架停止动画来表达。

## 骨架屏与 SSR

服务端渲染页面时，如果服务端已经拿到数据，应直接输出内容，避免客户端先看到完整页面又退回骨架。如果数据只能在客户端获取，可以让服务端输出稳定骨架，但服务端和客户端的初始结构必须一致，避免 hydration 警告。

## 小结

骨架屏的质量取决于状态设计和布局稳定性，而不是渐变写得多漂亮。它应该接近真实内容尺寸、只在等待足够长时出现、尊重减少动态效果设置，并与空状态、错误状态和后台刷新明确区分。
