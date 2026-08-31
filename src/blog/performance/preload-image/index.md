---
title: '图片预加载'
description: '展示图片资源预加载进度和加载完成后的呈现状态。'
pubDate: '2023-06-23'
category: '性能优化'
categorySlug: 'performance'
tags: ['Preload']
difficulty: 3
source: 'vue-practice/src/views/performance/preload-image/index.vue'
---

> **临时说明**：本文由 AI 根据当前 `index.vue` 整理，已经补充浏览器缓存、并发控制和图片解码等工程问题，但仍不是最终发布版本。

## 预加载解决什么问题

图片预加载是“在真正展示之前先请求资源”。它适合下一屏轮播图、即将打开的产品大图、游戏下一关素材等高概率马上使用的资源。

它不会让资源体积变小，也不会让网络变快，只是把等待时间提前。如果把几十张用户可能永远看不到的图片全部预加载，首屏带宽反而会被挤占。

预加载与懒加载方向相反：

- 预加载提前请求高概率需要的资源。
- 懒加载推迟低优先级资源，直到接近视口再请求。

真实页面通常同时使用两者，而不是二选一。

## new Image() 为什么能预加载

```ts
const image = new Image()
image.src = src
```

给未插入 DOM 的 `Image` 对象设置 `src`，浏览器同样会发起图片请求。请求成功后，资源通常进入浏览器缓存；后续页面中的 `<img src="同一地址">` 可以复用缓存结果。

“通常”很重要。是否命中缓存取决于 URL、响应缓存头、跨域策略和浏览器缓存状态。开发环境点击“重新预加载”很快完成，往往是缓存命中，不代表首次访问也同样快。

## 把单张图片包装成 Promise

```ts
const loadImage = (src: string, currentRequestId: number) =>
  new Promise<void>((resolve) => {
    const image = new Image()

    image.onload = () => {
      if (currentRequestId === requestId) {
        loadedCount.value += 1
      }
      resolve()
    }

    image.onerror = () => {
      if (currentRequestId === requestId) {
        loadedCount.value += 1
      }
      resolve()
    }

    image.src = src
  })
```

把事件 API 包装成 Promise 后，批量加载可以使用 `Promise.all` 组织。当前代码在 `onerror` 时也 resolve，是为了保证一张图片失败不会让整个批次永久停在 loading。

因此 `loadedCount` 更准确的名字其实是 `completedCount`：它统计“已经结束的任务”，包含成功和失败。生产版本应分别记录：

```ts
const completedCount = ref(0)
const failedUrls = ref<string[]>([])
```

进度可以按完成数计算，但最终结果必须告诉用户哪些资源失败了。

## Promise.all 带来的并发问题

```ts
await Promise.all(imageList.map((src) => loadImage(src, currentRequestId)))
```

十二张小图可以同时发起。若列表变成数百张大图，这会抢占网络连接、内存和解码资源，甚至拖慢页面真正重要的 API。

可以使用固定并发数的任务池，例如每次只加载四张；也可以按优先级分组，先加载当前可见资源，再处理下一屏。预加载不是越快发出所有请求越好，而是要让关键资源先完成。

## onload 不一定代表已经准备好绘制

`load` 表示图片数据已经成功获取，但图片解码可能仍然占用时间。现代浏览器支持：

```ts
await image.decode()
```

在需要无闪烁切换大图的场景，可以等待 `decode()` 完成后再更新 UI。需要用 try/catch 处理解码失败，并为不支持的环境准备回退。

对于首屏关键图片，HTML 中的 `<link rel="preload" as="image">` 或框架提供的图片优化能力，往往比组件挂载后才执行 `new Image()` 更早；但 preload 使用过多会提高无关资源优先级，应只用于真正关键的少量资源。

## 进度条为什么来自完成数量

```ts
const progress = computed(() => Math.round((loadedCount.value / imageList.length) * 100))
```

这种进度只按文件数量平均计算。一张 20KB 图和一张 5MB 图各占相同百分比，所以它是“任务进度”，不是精确字节进度。

图片元素的 load 事件拿不到持续下载的字节数。若必须显示真实网络进度，需要使用 fetch 读取流、统计 `Content-Length`，再把 Blob 转成对象 URL；实现复杂度和内存占用都会提高。

## requestId 防止旧批次污染状态

用户连续点击重新加载时，第一批请求不会自动消失。当前示例为每个批次生成编号：

```ts
requestId += 1
const currentRequestId = requestId
```

回调只有在编号仍等于当前批次时才更新计数。这个策略叫“忽略过期结果”，它没有取消网络请求，只是阻止旧结果写回新界面。

普通 `Image` 请求没有像 fetch 一样直接接收 `AbortSignal`。如果确实需要取消，可以改用 fetch，但要权衡缓存复用、跨域和 Blob 生命周期。

## 展示阶段还要避免布局跳动

预加载成功不等于布局稳定。图片容器仍应提前声明尺寸：

```css
.preload-grid li {
  aspect-ratio: 1;
}
```

这样图片出现前后占用空间一致，能降低 CLS。示例用占位块覆盖加载阶段，完成后统一切换到图片网格；真实产品也可以逐张显示，但每张卡片尺寸必须稳定。

## 什么时候不该预加载

- 图片低概率被查看，或者用户需要滚动很远才会看到。
- 用户处于节省流量模式或慢速网络。
- 首屏还有字体、脚本和接口等更关键资源未完成。
- 图片 URL 很快过期，提前加载后真正使用时已经失效。

可以结合 `navigator.connection`、业务转化路径和真实用户监控决定策略，不应只因为“切换看起来更顺”就无条件预加载。

## 小结

图片预加载的核心是资源调度，而不是 `new Image()` 这一行 API。一个可靠方案要区分成功和完成、限制并发、考虑解码与缓存，并确保提前请求没有伤害首屏关键资源。只有用户大概率马上需要的内容，才值得占用当前带宽。
