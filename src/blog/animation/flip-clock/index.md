---
title: '翻页时钟'
description: '模拟数字时钟的翻页切换动效。'
pubDate: '2022-11-07'
category: '动画动效'
categorySlug: 'animation'
tags: ['时钟动效']
difficulty: 3
source: 'vue-practice/src/views/animation/flip-clock/index.vue'
---

> **临时说明**：本文由 AI 根据当前 `index.vue` 整理，已经补充翻页结构、状态同步和计时误差等内容，但仍不是最终发布版本。

## 翻页时钟难在哪里

普通数字时钟只要每秒替换一次文本。翻页时钟却要同时保留“旧数字”和“新数字”，让旧数字的上半片翻走，再让新数字的下半片接上。如果只修改一个文本节点，浏览器没有足够的信息绘制这段过渡。

因此，一个数字格至少包含四个可见层：

1. 静止的旧数字上半部分。
2. 静止的新数字下半部分。
3. 向下翻出的旧数字面板。
4. 从背面翻入的新数字面板。

当前演示展示真实时间，并且只对发生变化的位置播放动画。例如 `12:59:59` 变成 `13:00:00` 时，小时个位、分钟和秒钟都会变化，而小时十位不需要动画。

## 先把时间变成可比较的数据

`Intl.DateTimeFormat` 负责本地化和补零，避免手动处理 `9` 变成 `09`：

```ts
const formatTime = (date: Date) =>
  new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
    .format(date)
    .split('')
```

格式化结果类似 `['1', '4', ':', '0', '8', ':', '3', '6']`。拆成数组后，模板可以按位置渲染，更新时也能逐位比较。

## 为什么同时保存新旧两组数字

组件维护了三份状态：

```ts
const currentDigits = ref<string[]>([])
const previousDigits = ref<string[]>([])
const flippingIndexes = ref(new Set<number>())
```

- `currentDigits` 是本次更新后的数字。
- `previousDigits` 是动画开始前的数字。
- `flippingIndexes` 记录哪些位置需要播放动画。

更新时先比较，再替换状态：

```ts
const nextDigits = formatTime(new Date())
const changed = new Set<number>()

nextDigits.forEach((digit, index) => {
  if (currentDigits.value[index] && currentDigits.value[index] !== digit) {
    changed.add(index)
  }
})

previousDigits.value = currentDigits.value.length ? currentDigits.value : nextDigits
currentDigits.value = nextDigits
flippingIndexes.value = changed
```

使用 `Set` 比数组更贴合语义：这里关心的是“某个索引是否发生变化”，而不是变化顺序。模板中调用 `flippingIndexes.has(index)` 也很直观。

## 半个数字是怎样裁出来的

上半片和下半片都只有数字格的一半高度，并通过 `overflow: hidden` 裁切。上半片让内容贴底，下半片让内容贴顶，于是两块拼在一起时仍然像一个完整数字。

```css
.digit-half,
.flip-panel {
  position: absolute;
  right: 0;
  left: 0;
  overflow: hidden;
  height: 50%;
}

.digit-half--top {
  top: 0;
  align-items: flex-end;
}

.digit-half--bottom {
  bottom: 0;
  align-items: flex-start;
}
```

这也是翻页组件中最容易写错的部分：上半片不是把字号缩小一半，而是显示完整数字的上半段。

## 3D 翻转的关键

父容器提供透视距离：

```css
.clock-face {
  perspective: 900px;
}
```

旧数字面板以下边缘为旋转轴，从 `0deg` 转到 `-180deg`；新数字面板以上边缘为旋转轴，从背面 `180deg` 转回 `0deg`。

```css
.flip-panel--front {
  transform-origin: bottom;
}

.flip-panel--back {
  transform: rotateX(180deg);
  transform-origin: top;
}
```

`backface-visibility: hidden` 会隐藏面板背面，否则旋转超过 90 度时可能看到镜像数字。

## 动画结束后为什么要同步状态

翻转完成后，旧数字已经没有继续保留的价值。组件在 `680ms` 后清空动画索引，并让 `previousDigits` 与当前数字一致：

```ts
flipTimer = window.setTimeout(() => {
  flippingIndexes.value = new Set()
  previousDigits.value = currentDigits.value
}, 680)
```

这一步相当于提交本次视觉状态。下一秒到来时，新的“旧数字”才是上一秒的结果，而不是组件初次渲染的内容。

## setInterval 并不等于精准时钟

演示使用 `setInterval(updateTime, 1000)`，足够说明翻页原理，但不应把它当作计时源。浏览器主线程忙碌、标签页进入后台或系统休眠时，回调都可能延迟。

正确思路是每次都用 `new Date()` 读取系统时间，定时器只负责触发刷新。对时间精度要求更高时，可以根据 `1000 - (Date.now() % 1000)` 计算下一次刷新延迟，使回调重新对齐整秒；页面从后台恢复时，也应立即重新同步一次。

## 生命周期和无障碍

组件卸载时要同时清理每秒更新定时器和动画结束定时器，避免离开页面后继续更新状态。

翻页动画还应考虑 `prefers-reduced-motion`。用户选择减少动态效果时，可以直接替换数字，保留时间信息而关闭 3D 翻转。时钟区域通过 `aria-label="当前时间"` 提供了基本语义，正式组件还可以增加一段只供屏幕阅读器读取的完整时间文本，避免逐个数字朗读。

## 小结

翻页时钟本质上是一个“前后状态过渡器”：先保存旧值，再计算新值，只标记发生变化的位置，最后在动画结束后提交状态。掌握这套模式后，它不仅能做时钟，也可以用于里程表、价格变化和实时数据看板。
