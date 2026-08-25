---
title: '如何使用 GSAP 实现一个楼层切换动画？'
description: '最近在拆一个楼层切换动画：页面滚动到某一段时，当前区域会被固定住，继续滚动时页面本身不再往下走，而是开始播放一段过渡动画。'
pubDate: '2026-08-10'
category: '动画动效'
categorySlug: 'animation'
tags: ['GSAP', '动效']
difficulty: 4
source: 'vue-practice/src/views/animation/floor-change/index.md'
demoSlug: 'animation-floor-change'
---

## 前言

最近在拆一个楼层切换动画：页面滚动到某一段时，当前区域会被固定住，继续滚动时页面本身不再往下走，而是开始播放一段过渡动画。

这类动画常见于产品官网，尤其是手机、汽车、耳机这类需要强调视觉冲击力的页面。

当前这个 demo 的核心效果可以理解成：

1. 第一屏是产品主视觉；
2. 第二屏是一个卡片网格；
3. 滚动过程中，中间卡片从接近全屏的状态慢慢缩小回网格；
4. 左右两张卡片从两侧移动回来；
5. 底部一排卡片从下方进入；
6. 整个过程由滚动进度控制。

也就是说，它不是普通的“滚动到第二屏”，而是借助 GSAP 的 `ScrollTrigger`，把滚动距离变成了一条动画时间线。

## DOM 结构拆解

当前组件的 DOM 可以分成三层：

```vue
<template>
  <div class="floor-container" ref="mainContainer">
    <div class="sticky-wrapper" ref="stickyRef">
      <section class="floor1-container">
        <!-- 第一屏内容 -->
      </section>

      <section class="floor2-container">
        <!-- 第二屏卡片内容 -->
      </section>
    </div>
  </div>
</template>
```

第一层是 `.floor-container`，它是 ScrollTrigger 的触发容器。

第二层是 `.sticky-wrapper`，它是真正被固定在屏幕中的视觉舞台，高度为 `100vh`。

第三层是两个楼层：

1. `.floor1-container`：第一屏产品主视觉；
2. `.floor2-container`：第二屏卡片网格。

这种结构的好处是：滚动时固定的是整个舞台，而舞台里的元素可以通过 GSAP 单独运动。

## 第一屏结构

第一屏主要包含产品文案和背景图：

```vue
<section class="floor1-container">
  <div class="floor1-text">
    <img src="..." alt="">
    <p class="floor-title">Reno14 Pro <span>5G</span></p>
    <p class="floor-desc">AI Flash Photography | Al Editor 2.0</p>
  </div>

  <img class="kv-bg" src="..." alt="">
</section>
```

它在样式上是绝对定位铺满整个舞台：

```css
.floor1-container {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2;
}
```

这里的 `z-index: 2` 表示第一屏默认在第二屏上面。

## 第二屏结构

第二屏是一个上下两排的卡片布局：

```vue
<section class="floor2-container">
  <ul class="floor2-content-top">
    <li class="item1 card">
      <p>AI Flash Photography</p>
      <img src="..." alt="">
    </li>

    <li class="item2 card">
      <p>Iridescent Mermaid Design</p>
      <img src="..." alt="">
    </li>

    <li class="item3 card">
      <p>AI Editor 2.0</p>
      <img src="..." alt="">
    </li>
  </ul>

  <ul class="floor2-content-bottom">
    <li class="item4 card"></li>
    <li class="item5 card"></li>
    <li class="item6 card"></li>
  </ul>
</section>
```

其中最重要的是 `.item2`。

它不是普通卡片，而是这段动画的“主角”：动画一开始，`.item2` 会被放大到接近全屏；随着滚动推进，它再缩小回自己在网格中的位置。

这就是这个动画最核心的视觉错觉：

> 看起来像是第一屏切到了第二屏，实际上是第二屏中间那张卡片从全屏状态回到了卡片状态。

## 注册 ScrollTrigger

脚本部分先引入 GSAP 和 ScrollTrigger：

```js
import { onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)
```

然后准备两个 ref：

```js
const mainContainer = ref(null)
const stickyRef = ref(null)
```

当前代码中真正用到的是 `mainContainer`，它作为 ScrollTrigger 的 `trigger`。

`stickyRef` 暂时没有参与动画逻辑，如果后续要扩展，比如读取舞台尺寸、控制内部元素，也可以继续使用。

## 核心计算：让中间卡片覆盖屏幕

动画一开始要让 `.item2` 看起来像全屏图，所以需要计算它应该放大多少倍。

```js
const item2 = document.querySelector('.item2')
const rect = item2.getBoundingClientRect()

const scaleX = window.innerWidth / rect.width
const scaleY = window.innerHeight / rect.height
const coverScale = Math.max(scaleX, scaleY)
```

这里分别计算了两个比例：

1. `scaleX`：卡片宽度放大到屏幕宽度需要多少倍；
2. `scaleY`：卡片高度放大到屏幕高度需要多少倍。

最后取 `Math.max(scaleX, scaleY)`：

```js
const coverScale = Math.max(scaleX, scaleY)
```

原因是：如果要让卡片图片覆盖整个屏幕，宽和高至少都要覆盖住视口。

如果取较小值，可能会出现横向或纵向留白；取较大值，才能保证它有足够大的尺寸覆盖整个画面。

## 计算垂直居中偏移

只放大还不够，因为 `.item2` 在网格布局中不一定刚好处在屏幕中心。

所以还要计算它距离屏幕中心差多少：

```js
const screenCenterY = window.innerHeight / 2
const elementCenterY = rect.top + rect.height / 2
const yOffset = screenCenterY - elementCenterY
```

可以这样理解：

```txt
需要移动的距离 = 屏幕中心点 - 元素中心点
```

如果 `yOffset` 是正数，说明元素中心在屏幕中心上方，需要往下移动。

如果 `yOffset` 是负数，说明元素中心在屏幕中心下方，需要往上移动。

这个偏移会作为 `.item2` 动画开始时的 `y` 值。

## 创建滚动时间线

接下来创建 GSAP 时间线：

```js
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: mainContainer.value,
    start: 'top top',
    end: '+=300%',
    scrub: 1,
    pin: true,
  },
})
```

这里几个配置很关键。

`trigger: mainContainer.value` 表示这段滚动动画由 `.floor-container` 触发。

`start: "top top"` 表示容器顶部碰到视口顶部时，动画开始。

`end: "+=300%"` 表示动画会占用额外三屏的滚动距离。滚动距离越长，动画播放得越慢；滚动距离越短，动画播放得越快。

`scrub: 1` 表示动画进度和滚动进度绑定，同时带一点平滑延迟。

`pin: true` 表示动画播放期间，把触发容器固定在视口中。

## 编排动画

当前动画全部从时间线的 `0` 位置开始：

```js
tl.fromTo(
  '.item2',
  { y: yOffset, scale: coverScale, zIndex: 100 },
  { y: 0, scale: 1, zIndex: 1, duration: 2 },
  0,
)

tl.fromTo('.item1', { x: -window.innerWidth / 2.9 }, { x: 0, duration: 2 }, 0)

tl.fromTo('.item3', { x: window.innerWidth / 2.9 }, { x: 0, duration: 2 }, 0)

tl.fromTo('.floor2-content-bottom', { y: window.innerHeight / 2 }, { y: 0, duration: 2 }, 0)
```

最后一个参数 `0` 很重要。

它表示这些动画不是一个接一个播放，而是同时开始。

所以滚动时会看到：

1. 中间卡片从全屏状态缩小；
2. 左侧卡片从左边回到原位；
3. 右侧卡片从右边回到原位；
4. 底部卡片组从下方上移；
5. 第二屏的卡片网格逐渐组合完成。

## 为什么使用 fromTo？

这里使用的是 `fromTo()`：

```js
tl.fromTo(target, fromVars, toVars, position)
```

它的好处是开始状态和结束状态都很明确。

以 `.item2` 为例：

```js
tl.fromTo(
  '.item2',
  { y: yOffset, scale: coverScale, zIndex: 100 },
  { y: 0, scale: 1, zIndex: 1, duration: 2 },
  0,
)
```

这段代码可以翻译成：

```txt
动画开始时：
item2 位于屏幕中心附近，并且放大到可以覆盖屏幕

动画结束时：
item2 回到原本布局中的位置，缩放恢复为 1
```

所以这个动画不是“把卡片放大”，而是反过来：

> 一开始就让卡片处于放大状态，然后随着滚动把它收回到卡片布局中。

这也是它看起来像楼层切换的关键。

## 样式如何配合动画？

舞台容器负责固定视口尺寸和隐藏溢出：

```css
.sticky-wrapper {
  position: relative;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}
```

`overflow: hidden` 很重要，因为卡片从左右或下方移动进来时，超出舞台的部分不会显示出来。

第二屏卡片使用绝对定位铺满舞台：

```css
.floor2-container {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 20px;
  padding: 50px;
}
```

卡片本身固定为 `40vh`：

```css
.card {
  background: #1d1d1f;
  overflow: hidden;
  color: white;
  flex: 1;
  height: 40vh;
  position: relative;
}
```

图片使用 `object-fit: cover`：

```css
.card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

这样图片可以填满卡片，不会因为卡片比例变化而变形。

## 当前动画的完整流程

从滚动开始到结束，可以拆成这样：

```txt
滚动开始
↓
ScrollTrigger pin 住当前区域
↓
item2 以放大状态覆盖视觉中心
↓
用户继续滚动，时间线向前播放
↓
item2 缩小并回到中间卡片位置
↓
item1 从左侧进入
↓
item3 从右侧进入
↓
底部卡片组从下方进入
↓
第二屏卡片网格成型
↓
滚动距离结束，页面继续向下
```

## 可以继续优化的点

当前代码已经能表达核心动画，但如果要放到更完整的项目中，还有几个地方可以继续优化。

### 1. 使用 ref 替代 document.querySelector

当前代码中是这样获取 `.item2` 的：

```js
const item2 = document.querySelector('.item2')
```

在 Vue 组件中，更推荐给元素绑定 `ref`，这样可以避免全局查询，也能减少多个同类组件同时存在时的冲突。

### 2. 卸载时清理 ScrollTrigger

当前代码在 `onMounted` 中创建了时间线，但没有在组件卸载时清理。

如果这个页面会被路由反复进入和离开，建议在 `onBeforeUnmount` 中调用 `tl.kill()` 或使用 `gsap.context()` 管理动画。

### 3. 处理窗口尺寸变化

`coverScale`、`yOffset`、左右卡片位移都依赖 `window.innerWidth` 和 `window.innerHeight`。

如果用户在动画页面中改变窗口尺寸，旧的计算值可能不再准确。

可以配合 `invalidateOnRefresh: true`，或者在刷新时重新计算这些函数型数值。

### 4. 注意 z-index 的层级关系

`.floor1-container` 的 `z-index` 是 `2`，`.floor2-container` 的 `z-index` 是 `1`。

虽然动画里给 `.item2` 设置了 `zIndex: 100`，但它仍然在 `.floor2-container` 这个层级里面。

如果希望 `.item2` 真正盖到第一屏内容上方，需要确认父级 stacking context 是否允许它越过第一屏，或者调整两个楼层的层级关系。

## 总结

这个楼层切换动画的核心不是写很多复杂动画，而是先想清楚视觉关系：

1. 固定一个 `100vh` 的舞台；
2. 把两个楼层叠在同一个舞台里；
3. 让第二屏中间卡片一开始处于全屏覆盖状态；
4. 通过滚动把它收缩回卡片；
5. 同时让其他卡片从边缘进入；
6. 用 `ScrollTrigger` 把整段动画和滚动进度绑定。

理解了这个思路之后，类似的产品官网楼层切换、卡片展开、视觉图收缩成模块等效果，都可以用同一套方式去拆。
