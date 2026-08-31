---
title: 'GSAP ScrollTrigger 基础'
description: '用 ScrollTrigger 绑定滚动进度，观察基础动画触发方式。'
pubDate: '2023-08-09'
category: '动画动效'
categorySlug: 'animation'
tags: ['GSAP']
difficulty: 3
source: 'vue-practice/src/views/animation/gsap-basics/index.vue'
---

> **临时说明**：本文由 AI 根据当前 `index.vue` 整理，已补充 ScrollTrigger 坐标含义和 Vue 生命周期处理，但仍不是最终发布版本。

## 补间动画和滚动动画不是一回事

GSAP 最基础的能力是补间：给出目标状态和持续时间，动画引擎负责计算中间帧。ScrollTrigger 则多了一层“滚动位置到动画进度”的映射。

当前示例特意放了两个方块：

- 第一个方块在组件挂载后自动移动并旋转，是时间驱动动画。
- 第二个方块由滚动位置控制，是滚动驱动动画。

两者都使用 `gsap.to`，但播放控制权不同。理解这一点比记住某个配置项更重要。

## 在 Vue 中获取动画目标

GSAP 最终操作的是真实 DOM，因此组件用模板引用保存节点：

```ts
const pageRef = ref<HTMLElement | null>(null)
const boxOneRef = ref<HTMLElement | null>(null)
const boxTwoRef = ref<HTMLElement | null>(null)
```

只有等到 `onMounted` 后，Vue 才保证这些元素已经进入 DOM。动画初始化前仍要做空值检查，因为组件可能在异步挂载或条件渲染过程中提前退出。

## 普通 gsap.to 做了什么

```ts
gsap.to(boxOne, {
  rotation: 360,
  x: 200,
  duration: 2,
  ease: 'power2.out',
})
```

`to` 表示从元素当前状态过渡到目标状态。`x` 和 `rotation` 最终会合并为 CSS `transform`，通常不会改变周围元素的布局。

- `duration: 2` 表示动画持续两秒。
- `rotation: 360` 表示旋转一整圈。
- `power2.out` 前快后慢，让元素在结束前自然减速。

如果这里使用 `left: 200px`，元素必须先具备定位上下文，而且动画过程中可能产生更多布局计算。位移动画优先使用 `x/y` 通常更省事。

## ScrollTrigger 如何理解 start 和 end

```ts
gsap.to(boxTwo, {
  x: 300,
  ease: 'none',
  scrollTrigger: {
    trigger: page,
    start: 'top+=400 top',
    end: 'top+=800 top',
    scrub: true,
  },
})
```

ScrollTrigger 的位置表达式由两部分组成：前半部分描述触发元素，后半部分描述视口。

`top+=400 top` 可以理解为“触发元素顶部向下 400 像素的位置到达视口顶部时开始”。`top+=800 top` 则是结束位置。两个位置之间的滚动距离会映射为动画的 `0%` 到 `100%`。

调试复杂页面时，可以临时加入 `markers: true`，直接看到 start、end 和 scroller 的位置，比凭感觉修改数字可靠得多。

## scrub 为什么配合 ease: none

`scrub: true` 表示动画进度紧跟滚动进度。用户向回滚动，动画也会反向退回。

此时通常使用 `ease: 'none'`，让滚动距离和位移保持线性关系。如果叠加明显的缓动，页面滚动一半时元素不一定移动一半，用户会感到内容与滚动脱节。

也可以把 `scrub` 设置为数字，例如 `scrub: 0.5`，让动画用半秒追上滚动进度，视觉更柔和，但会引入轻微延迟。

## 为什么使用 gsap.context

```ts
animationContext = gsap.context(() => {
  // 创建当前组件内的动画
}, page)
```

`gsap.context` 把回调中创建的动画、ScrollTrigger 和样式修改归入同一个作用域。第二个参数限定了选择和清理范围，尤其适合会反复挂载、卸载的 Vue 页面。

组件离开时调用：

```ts
onBeforeUnmount(() => {
  animationContext?.revert()
})
```

`revert()` 不只停止时间轴，还会撤销 GSAP 写入的内联样式并销毁相关 ScrollTrigger。只调用 `kill()` 往往不能完整恢复初始样式。

## 常见问题

### 动画位置在图片加载后发生偏移

ScrollTrigger 初始化时会测量页面。如果字体、图片或折叠区域随后改变高度，需要在布局稳定后调用 `ScrollTrigger.refresh()`。不要在每次滚动时刷新，那会带来明显测量开销。

### 自定义滚动容器没有触发

默认监听窗口滚动。如果实际滚动发生在 `.demo-stage` 或业务容器中，需要通过 `scroller` 指定正确元素，并确认容器真的设置了可滚动高度。

### 开发环境动画执行两次

路由切换或热更新会让组件重新挂载。若初始化逻辑没有 context 和清理函数，旧触发器会残留，表现为回调重复或位置越来越奇怪。

## 小结

这个案例覆盖了 GSAP 在组件项目中的最小闭环：挂载后创建动画、明确滚动起止坐标、用 `scrub` 绑定进度、卸载时完整还原。真正投入业务前，还需要把图片加载、响应式断点和自定义滚动容器纳入 ScrollTrigger 的测量时机。
