---
title: 'Canvas 基础图形'
description: '演示 Canvas 线条、矩形、圆形等基础绘制能力。'
pubDate: '2020-04-11'
category: 'Canvas 实验'
categorySlug: 'canvas'
tags: ['Canvas']
difficulty: 1
source: 'vue-practice/src/views/canvas/basic-shapes/index.vue'
---

> **临时说明**：本文由 AI 根据当前 `index.vue` 整理，已经补充 Canvas 路径模型和绘制状态等基础原理，但仍不是最终发布版本。

## Canvas 不是一组 DOM 元素

`<canvas>` 看起来只是一个标签，但它内部更像一张可以被脚本反复涂改的位图。调用 `fillRect` 或 `stroke` 后，浏览器把结果写进像素缓冲区，并不会为线段和圆形创建可查询的 DOM 节点。

这会带来两个直接影响：

- 绘制完成后，不能通过选择器找到“刚才那个圆”；交互命中需要自己保存图形数据并计算坐标。
- 修改一个图形时，通常要清空画布并根据当前状态重新绘制整个场景。

这个基础示例集中绘制线段、三角形、矩形、圆和圆弧，目的是先理解 Canvas 的命令式绘制模型。

## 获取 2D 绘图上下文

Vue 组件要等 DOM 挂载后才能拿到画布：

```ts
const canvasRef = ref<HTMLCanvasElement | null>(null)

onMounted(drawShapes)
```

绘制函数先获取 `CanvasRenderingContext2D`：

```ts
const canvas = canvasRef.value
const context = canvas?.getContext('2d')

if (!canvas || !context) {
  return
}
```

上下文保存了当前画笔状态、变换矩阵和绘制 API。后续所有命令都会作用在这一个上下文上。

## 路径只是“草稿”，stroke 和 fill 才会落笔

```ts
context.beginPath()
context.moveTo(25, 25)
context.lineTo(105, 25)
context.stroke()
```

`beginPath()` 清空当前路径列表，`moveTo()` 移动画笔但不绘制，`lineTo()` 添加线段。直到调用 `stroke()`，路径才按当前描边样式写入画布。

如果忘记 `beginPath()`，新线段可能和上一段路径连在一起；如果只写 `lineTo()` 不写 `stroke()`，画布不会出现任何内容。

三角形比线段多一步 `closePath()`：

```ts
context.beginPath()
context.moveTo(150, 25)
context.lineTo(200, 25)
context.lineTo(150, 75)
context.closePath()
context.stroke()
```

`closePath()` 会从当前点连接回路径起点。对填充图形来说，浏览器通常会隐式闭合轮廓；对描边来说，显式闭合能让连接处的线帽和拐角更一致。

## 为什么矩形不需要 beginPath

`fillRect`、`strokeRect` 和 `clearRect` 是即时绘制命令，不会把矩形追加到当前路径：

```ts
context.strokeRect(10, 100, 50, 50)
context.fillStyle = '#48bb78'
context.fillRect(15, 105, 40, 40)
context.clearRect(25, 115, 20, 20)
```

执行顺序决定最终像素。这里先画边框，再填充内部，最后擦除中心区域。Canvas 没有自动图层，后画的内容会覆盖先画的内容。

如果矩形需要和其他线条组成一个复杂路径，再使用 `context.rect()` 把它加入路径更合适。

## arc 的参数怎么读

```ts
context.arc(100, 125, 25, 0, Math.PI * 2)
```

参数依次是圆心 `x`、圆心 `y`、半径、起始角、结束角，以及可选的逆时针标记。Canvas 使用弧度而不是角度：

```text
180° = Math.PI
360° = Math.PI * 2
```

坐标系原点位于左上角，X 轴向右，Y 轴向下。因此在默认坐标系中，角度方向的视觉结果可能和数学课本中的直角坐标系不完全一致。

## 绘图状态会影响后续命令

```ts
context.lineWidth = 2
context.strokeStyle = '#111827'
context.fillStyle = '#4299e1'
```

这些属性不是某个图形的局部样式，而是上下文的当前状态。设置一次 `fillStyle` 后，之后所有 `fill()` 和 `fillRect()` 都会沿用它，直到再次修改或通过 `save/restore` 恢复。

这也是 Canvas 与 SVG 的重要区别：SVG 把样式挂在元素上，Canvas 把样式留在画笔上。

## 清空和重绘

示例在绘制前调用：

```ts
context.clearRect(0, 0, canvas.width, canvas.height)
```

静态示例只执行一次，清空似乎可有可无；一旦加入动画、窗口缩放或数据更新，如果不清空，上一帧会残留并叠加成拖影。

需要注意，`canvas.width` 是画布内部像素宽度，CSS `width` 是页面显示宽度，两者不是同一个概念。只用 CSS 放大画布会把位图一起拉伸，导致模糊。

## 高清屏适配

当前基础示例为了突出 API，直接使用固定的 `width="500" height="200"`。生产环境通常需要根据 `devicePixelRatio` 放大内部缓冲区，再把绘图坐标缩放回 CSS 像素：

```ts
const ratio = window.devicePixelRatio || 1
canvas.width = rect.width * ratio
canvas.height = rect.height * ratio
context.setTransform(ratio, 0, 0, ratio, 0, 0)
```

否则在高分屏上，500 个内部像素可能要覆盖更多物理像素，线条和文字会显得发虚。

## 小结

Canvas 基础真正需要掌握的是三件事：路径先构建后落笔、绘图状态会持续影响后续命令、最终结果只是像素而不是元素。理解这三点后，再学习坐标变换、动画和命中检测会顺畅很多。
