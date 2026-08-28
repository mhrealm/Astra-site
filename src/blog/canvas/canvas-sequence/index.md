---
title: '如何用 Canvas + GSAP 实现滚动序列帧动画？'
description: '在很多产品官网中，经常能看到一种非常丝滑的滚动动画：用户向下滚动时，画面里的产品像视频一样旋转、展开、变化，但它并不一定是一个真正的视频。'
pubDate: '2024-06-18'
category: 'Canvas 实验'
categorySlug: 'canvas'
tags: ['Canvas']
difficulty: 4
source: 'vue-practice/src/views/canvas/canvas-sequence/index.md'
demoSlug: 'canvas-canvas-sequence'
---

## 前言

在很多产品官网中，经常能看到一种非常丝滑的滚动动画：用户向下滚动时，画面里的产品像视频一样旋转、展开、变化，但它并不一定是一个真正的视频。

这类效果很多时候是用“序列帧”实现的。

所谓序列帧，就是提前准备好一组连续图片：

```txt
0001.jpg
0002.jpg
0003.jpg
...
0147.jpg
```

滚动时不播放视频，而是根据滚动进度切换当前应该显示哪一张图片，然后把这张图片画到 `canvas` 上。

当前这个 demo 的核心逻辑就是：

1. 准备 147 张连续图片；
2. 页面滚动时，用 GSAP 改变当前帧编号；
3. 每次帧编号变化时，把对应图片绘制到 canvas；
4. canvas 固定在屏幕中心，制造出产品动画一直停留在视口中的感觉。

## DOM 结构

当前组件的 DOM 很简单：

```vue
<template>
  <section ref="containerRef" class="canvas-sequence-page">
    <h1 class="sequence-title">Canvas Scroll Sequence</h1>
    <canvas ref="canvasRef" class="sequence-canvas" />
  </section>
</template>
```

这里主要有两个元素：

1. `.canvas-sequence-page`：滚动容器，负责提供滚动距离；
2. `.sequence-canvas`：画布，负责显示当前序列帧。

标题 `.sequence-title` 是页面文案，它使用 `sticky` 固定在一定位置；真正的动画主体是下面的 `canvas`。

## 引入 GSAP 和 ScrollTrigger

脚本部分先引入 Vue、GSAP 和 ScrollTrigger：

```ts
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)
```

`ScrollTrigger` 的作用是把滚动进度和动画进度绑定起来。

普通动画通常是按照时间播放，比如 1 秒、2 秒、3 秒。但这个效果不是由时间决定的，而是由滚动位置决定的：

```txt
滚动到 0%   -> 显示第 1 帧
滚动到 50%  -> 显示中间帧
滚动到 100% -> 显示最后一帧
```

## 准备 DOM 引用

组件里准备了两个 ref：

```ts
const containerRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
```

`containerRef` 用来作为 ScrollTrigger 的触发容器。

`canvasRef` 用来获取 canvas 元素，并拿到它的 2D 绘图上下文。

## 准备帧状态

当前帧编号存放在一个普通对象里：

```ts
const sequenceState = {
  frame: 0,
}
```

这里没有使用 `ref`，是因为这个值不是用来驱动 Vue 模板更新的，而是交给 GSAP 直接修改。

GSAP 可以直接 tween 一个普通对象的数字属性：

```ts
gsap.to(sequenceState, {
  frame: frameCount - 1,
})
```

当 `sequenceState.frame` 变化时，我们只需要重新绘制 canvas，不需要触发 Vue 的响应式渲染。

## 基础配置

当前 demo 中定义了几个基础常量：

```ts
const frameCount = 147
const canvasWidth = 1158
const canvasHeight = 770
const scrollTriggerId = 'canvas-sequence'
```

含义分别是：

1. `frameCount`：序列帧总数，一共 147 张；
2. `canvasWidth`：canvas 的绘制宽度；
3. `canvasHeight`：canvas 的绘制高度；
4. `scrollTriggerId`：ScrollTrigger 的唯一标识，方便卸载时查找并清理。

## 生成序列帧地址

每一帧图片的地址通过 `getFrameUrl` 生成：

```ts
const getFrameUrl = (index: number) => {
  const frameIndex = String(index + 1).padStart(4, '0')

  return `https://www.apple.com/105/media/us/airpods-pro/2019/1299e2f5_9206_4470_b28e_08307a42f19b/anim/sequence/large/01-hero-lightpass/${frameIndex}.jpg`
}
```

这里有一个细节：

```ts
String(index + 1).padStart(4, '0')
```

数组下标是从 `0` 开始的，但图片文件名是从 `0001.jpg` 开始的。

所以：

```txt
index = 0   -> 0001.jpg
index = 1   -> 0002.jpg
index = 146 -> 0147.jpg
```

`padStart(4, '0')` 的作用就是把数字补成四位。

## 初始化 Canvas

核心逻辑写在 `onMounted` 中，因为只有组件挂载后，才能拿到真实 DOM。

```ts
onMounted(() => {
  const canvas = canvasRef.value
  const container = containerRef.value
  const context = canvas?.getContext('2d')

  if (!canvas || !container || !context) {
    return
  }

  canvas.width = canvasWidth
  canvas.height = canvasHeight
})
```

这里做了三件事：

1. 拿到 canvas 元素；
2. 拿到滚动容器；
3. 获取 `2d` 绘图上下文。

如果其中任何一个不存在，动画就不继续执行。

然后设置 canvas 的真实绘制尺寸：

```ts
canvas.width = canvasWidth
canvas.height = canvasHeight
```

注意这里设置的是 canvas 的绘图尺寸，不是 CSS 尺寸。

CSS 中会通过 `max-width`、`max-height` 控制它在页面里的显示大小。

## 加载图片序列

接下来创建所有图片对象：

```ts
const images = Array.from({ length: frameCount }, (_, index) => {
  const image = new Image()
  image.decoding = 'async'
  image.src = getFrameUrl(index)

  return image
})
```

这一步相当于把 147 张图片都生成出来。

`image.decoding = 'async'` 表示浏览器可以异步解码图片，避免图片解码阻塞主线程太久。

这里并没有等待所有图片加载完成后再开始动画，而是采用了更轻的方式：

1. 图片开始加载；
2. 滚动时尝试绘制当前帧；
3. 如果当前帧还没加载好，就先跳过；
4. 加载完成后，下次更新再绘制。

## 渲染当前帧

真正负责绘制的是 `render` 函数：

```ts
const render = () => {
  const frameIndex = Math.min(frameCount - 1, Math.max(0, Math.round(sequenceState.frame)))
  const image = images[frameIndex]

  if (!image || !image.complete || image.naturalWidth === 0) {
    return
  }

  context.clearRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
}
```

这里可以拆成三步。

第一步，计算当前应该显示哪一帧：

```ts
const frameIndex = Math.min(frameCount - 1, Math.max(0, Math.round(sequenceState.frame)))
```

`Math.round()` 把当前帧取整，因为图片帧只能是整数。

`Math.max(0, ...)` 保证帧编号不会小于 `0`。

`Math.min(frameCount - 1, ...)` 保证帧编号不会超过最后一帧。

第二步，判断图片是否可以绘制：

```ts
if (!image || !image.complete || image.naturalWidth === 0) {
  return
}
```

如果图片还没加载完成，就不绘制，避免 canvas 画出空内容或报错。

第三步，清空画布并绘制当前帧：

```ts
context.clearRect(0, 0, canvas.width, canvas.height)
context.drawImage(image, 0, 0, canvas.width, canvas.height)
```

`clearRect` 用来清掉上一帧。

`drawImage` 用来把当前帧图片画满整个 canvas。

## 先绘制第一帧

为了让页面刚进入时不是一片空白，当前代码给第一张图片加了一个 `load` 监听：

```ts
const initialImage = images[0]

if (initialImage) {
  firstImage = initialImage
  firstImageLoadHandler = render
  firstImage.addEventListener('load', firstImageLoadHandler, { once: true })
}
```

第一帧加载完成后，会执行一次 `render`。

这样即使用户还没有开始滚动，也可以先看到序列帧的第一张图。

`{ once: true }` 表示这个监听只执行一次，执行完会自动移除。

## 绑定滚动进度

最核心的动画在这里：

```ts
sequenceTween = gsap.to(sequenceState, {
  frame: frameCount - 1,
  snap: 'frame',
  ease: 'none',
  scrollTrigger: {
    id: scrollTriggerId,
    trigger: container,
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.5,
  },
  onUpdate: render,
})
```

这段代码的意思是：

```txt
随着滚动推进，把 sequenceState.frame 从 0 改到 146。
每次 frame 改变时，调用 render 重新绘制 canvas。
```

这里几个配置很关键。

### frame

```ts
frame: frameCount - 1
```

因为一共有 147 张图片，数组下标是 `0` 到 `146`，所以最后一帧是 `frameCount - 1`。

### snap

```ts
snap: 'frame'
```

`frame` 在动画过程中本来可能是小数，比如：

```txt
12.3
12.8
13.1
```

但图片编号必须是整数。

`snap: 'frame'` 会让 GSAP 把 `frame` 吸附到整数，减少无意义的小数帧。

### ease

```ts
ease: 'none'
```

这里不需要缓动曲线。

因为序列帧应该严格跟随滚动进度：滚动多少，就播放多少。

如果加了 `power2.out` 之类的缓动，滚动和帧变化之间会产生额外的速度变化，反而不容易控制。

### scrollTrigger

```ts
scrollTrigger: {
  id: scrollTriggerId,
  trigger: container,
  start: 'top top',
  end: 'bottom bottom',
  scrub: 0.5,
}
```

`start: 'top top'` 表示容器顶部到达视口顶部时，动画开始。

`end: 'bottom bottom'` 表示容器底部到达视口底部时，动画结束。

`scrub: 0.5` 表示滚动和动画绑定，同时带 0.5 秒左右的平滑跟随。

这个配置会让动画不是生硬地跳帧，而是有一点顺滑的追随感。

## 为什么没有使用 pin？

当前代码里没有设置 `pin: true`。

这是因为 canvas 自己已经使用了固定定位：

```css
.sequence-canvas {
  position: fixed;
  left: 50%;
  top: 50%;
  max-width: 100%;
  max-height: 100%;
  transform: translate(-50%, -50%);
}
```

也就是说，不需要 ScrollTrigger 去固定整个容器。

页面滚动时，`.canvas-sequence-page` 负责提供滚动距离；而 canvas 始终通过 `position: fixed` 停留在屏幕中心。

## 滚动距离从哪里来？

滚动距离来自容器高度：

```css
.canvas-sequence-page {
  position: relative;
  min-height: 3000px;
  overflow: hidden;
  background: #000;
}
```

`min-height: 3000px` 给页面制造了一段足够长的滚动区域。

ScrollTrigger 会把这段滚动距离映射到 `frame: 0 -> 146`。

如果滚动距离更短，序列帧播放会更快；如果滚动距离更长，序列帧播放会更慢。

## 标题为什么用 sticky？

标题的样式是：

```css
.sequence-title {
  position: sticky;
  top: 20vh;
  z-index: 2;
  margin: 0;
  padding-top: 64px;
  color: #fff;
  font-size: 56px;
  font-weight: 500;
  line-height: 1.1;
  text-align: center;
}
```

`position: sticky` 可以让标题在滚动时停留在距离顶部 `20vh` 的位置。

这样页面既有文字信息，又不会影响 canvas 固定在屏幕中心展示序列帧。

## 组件卸载时清理动画

最后需要在组件卸载时清理 GSAP 动画和 ScrollTrigger：

```ts
onBeforeUnmount(() => {
  sequenceTween?.kill()
  ScrollTrigger.getById(scrollTriggerId)?.kill()

  if (firstImage && firstImageLoadHandler) {
    firstImage.removeEventListener('load', firstImageLoadHandler)
  }
})
```

这里做了三件事：

1. `sequenceTween?.kill()`：销毁 GSAP tween；
2. `ScrollTrigger.getById(scrollTriggerId)?.kill()`：通过 id 找到对应 ScrollTrigger 并销毁；
3. 移除第一张图片的 `load` 监听，避免组件销毁后还触发回调。

对于这种绑定滚动和 DOM 的动画，卸载清理很重要。

如果不清理，路由切换后可能会残留 ScrollTrigger 实例，导致滚动监听重复执行。

## 完整流程回顾

这段动画可以总结成下面这条链路：

```txt
页面挂载
↓
获取 canvas 和 2d context
↓
设置 canvas 绘制尺寸
↓
创建 147 张 Image 对象
↓
第一帧加载完成后先渲染一次
↓
创建 GSAP tween
↓
ScrollTrigger 根据滚动进度修改 sequenceState.frame
↓
onUpdate 调用 render
↓
render 根据当前 frame 绘制对应图片
↓
滚动结束，显示最后一帧
↓
组件卸载时清理 tween、ScrollTrigger 和事件监听
```

## 可以继续优化的点

当前代码已经能完成基础的滚动序列帧效果，但如果要用在正式项目里，还可以继续优化几个地方。

### 1. 处理高清屏

当前 canvas 的绘制尺寸固定为：

```ts
const canvasWidth = 1158
const canvasHeight = 770
```

如果要适配高 DPR 屏幕，可以结合 `window.devicePixelRatio` 调整 canvas 实际绘制尺寸，再用 CSS 控制显示尺寸。

### 2. 做图片预加载进度

序列帧数量比较多，当前是直接创建所有图片对象。

如果网络较慢，滚动到某些帧时，图片可能还没加载完成，`render` 会直接跳过这一帧。

可以增加一个加载进度，等关键帧加载完成后再允许用户进入动画。

### 3. 处理首帧缓存情况

当前第一帧通过 `load` 事件触发首次渲染。

如果图片已经从缓存中加载完成，也可以额外判断：

```ts
if (initialImage.complete) {
  render()
}
```

这样首帧显示会更稳。

### 4. 处理窗口尺寸变化

现在 canvas 的绘制尺寸是固定的，CSS 通过 `max-width` 和 `max-height` 做适配。

如果后续要做更精细的响应式裁剪、居中或 cover 效果，可以在窗口尺寸变化时重新计算绘制区域。

## 总结

Canvas 序列帧滚动动画的核心不是 Canvas API 有多复杂，而是把三件事串起来：

1. 用图片序列模拟视频帧；
2. 用 GSAP 改变当前帧编号；
3. 用 ScrollTrigger 把滚动进度映射到帧编号；
4. 每次帧变化时，把对应图片画到 canvas。

理解了这套结构之后，类似 AirPods、手机旋转、产品拆解、车辆展示这类滚动动画，都可以用同样的方式去实现。
