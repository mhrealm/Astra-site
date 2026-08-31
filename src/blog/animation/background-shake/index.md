---
title: '背景抖动'
description: '通过背景位移和动画节奏模拟抖动反馈效果。'
pubDate: '2021-03-18'
category: '动画动效'
categorySlug: 'animation'
tags: ['视觉动效']
difficulty: 2
source: 'vue-practice/src/views/animation/background-shake/index.vue'
---

> **临时说明**：本文由 AI 根据当前 `index.vue` 整理，已经补充实现原理和工程注意点，但仍不是最终发布版本，后续会继续结合实际业务场景修订。

## 为什么需要“抖动反馈”

抖动不是为了让页面显得热闹，它更接近一种短促的视觉反馈：登录失败时提醒用户输入有误、拖拽越界时表达“不能继续”、游戏受到冲击时增强力度感。它的共同特点是时间短、位移小，而且动画结束后元素必须准确回到原位。

如果抖动幅度过大，用户会误以为页面布局发生了变化；如果持续时间太长，又会阻塞下一次操作。因此这个示例把动画控制在 `520ms`，只移动预览区域本身，不修改文档流中的尺寸。

## 演示结构

示例把“抖动”和“背景切换”组合成一段完整时序：

1. 用户点击按钮。
2. 预览区域进入抖动状态。
3. 动画结束后切换到下一组场景。
4. 清除动画状态，等待下一次触发。

场景内容是普通数据，而不是散落在模板里的条件判断：

```ts
const scenes = [
  {
    name: 'launch',
    title: '点击开始',
    color: '#1e80ff',
    background: 'linear-gradient(...)',
  },
  {
    name: 'impact',
    title: '切换背景',
    color: '#f97316',
    background: 'linear-gradient(...)',
  },
]
```

这种数据驱动方式的好处是，后续增加场景只需要追加配置，不必再复制一套 DOM。

## 把动画状态和业务状态分开

组件中有两个真正影响界面的响应式状态：

- `activeIndex` 决定当前显示哪个场景。
- `isShaking` 决定是否挂载动画类名。

`shakeTimer` 只是用于协调时序，不参与模板渲染，所以没有必要声明成 `ref`。

```ts
const activeIndex = ref(0)
const isShaking = ref(false)
let shakeTimer: number | null = null

const activeScene = computed(() => scenes[activeIndex.value]!)
```

按钮被点击后先播放动画，等 `520ms` 再切换背景：

```ts
const triggerShake = () => {
  stopShake()
  isShaking.value = true

  shakeTimer = window.setTimeout(() => {
    activeIndex.value = (activeIndex.value + 1) % scenes.length
    isShaking.value = false
    shakeTimer = null
  }, 520)
}
```

这里的取模运算让索引到达数组末尾后重新回到第一个场景，避免额外编写边界判断。

## 为什么使用 transform

抖动关键帧只修改 `transform`：

```css
@keyframes background-shake {
  30%,
  50%,
  70% {
    transform: translate3d(-8px, 0, 0);
  }

  40%,
  60% {
    transform: translate3d(8px, 0, 0);
  }
}
```

如果改成连续修改 `left`、`margin-left`，浏览器可能需要反复计算布局。`transform` 通常只影响合成阶段，更适合高频动画。`translate3d` 也明确表达了这是一个变换，而不是一次真实的布局移动。

关键帧并没有保持等幅摆动：前后位移较小，中间冲击最大，再逐渐回到原位。比起机械地左右重复同一个距离，这种节奏更接近真实反馈。

## 背景切换为什么使用两层

所有场景层都绝对定位在同一位置，只改变 `opacity` 和 `scale`：

```css
.scene-layer {
  position: absolute;
  inset: 0;
  opacity: 0;
  transform: scale(1.04);
  transition:
    opacity 360ms ease,
    transform 520ms ease;
}

.scene-layer--active {
  opacity: 1;
  transform: scale(1);
}
```

这样切换时容器高度不会变化，也不会因为替换 DOM 产生闪白。代价是所有背景层都会留在页面中；如果真实项目包含几十张大图，应只保留当前和下一张，或者提前控制图片解码和缓存。

## 连续点击和组件卸载

示例在动画期间禁用按钮，避免同一段动画被重复触发。即使未来取消禁用，也应该先清理旧计时器：

```ts
const stopShake = () => {
  if (shakeTimer !== null) {
    window.clearTimeout(shakeTimer)
    shakeTimer = null
  }
}

onBeforeUnmount(stopShake)
```

组件卸载后如果计时器仍然执行，它还会尝试修改已经离开的页面状态。清理计时器看起来只是几行代码，却是可复用动画组件必须具备的生命周期意识。

## 生产环境还应处理什么

- 对 `prefers-reduced-motion: reduce` 提供无抖动或弱动画版本，照顾容易眩晕的用户。
- 错误提示不能只依赖动画，还应有文字和可被辅助技术读取的状态。
- 动画持续时间最好成为配置，而不是让 JavaScript 的 `520` 与 CSS 的 `520ms` 分别维护。
- 如果场景切换依赖接口结果，应由业务状态驱动，不要假设计时器结束就一定成功。

## 小结

这个案例真正值得保留的不是几段关键帧，而是“反馈动画”和“业务状态”之间的边界：Vue 负责状态与时序，CSS 负责高频视觉变化，生命周期负责清理副作用。三者分工清楚后，同一套思路可以继续用于表单错误、拖拽越界和操作失败反馈。
