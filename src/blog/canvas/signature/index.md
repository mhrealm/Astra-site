---
title: 'Canvas 电子签名'
description: '实现可书写、清空和保存的 Canvas 签名面板。'
pubDate: '2022-05-21'
category: 'Animation'
categorySlug: 'animation'
tags: ['Canvas']
difficulty: 3
source: 'vue-practice/src/views/canvas/signature/index.vue'
---

> **临时说明**：本文由 AI 根据当前 `index.vue` 整理，已经补充坐标换算、Pointer Events 和高清屏处理，但仍不是最终发布版本。

## 电子签名不只是监听 mousemove

最小实现确实只是按下时开始、移动时连线、松开时停止。但要在真实设备上可用，还要处理触摸输入、元素边界、DPR、窗口缩放、笔迹平滑和导出结果。

当前演示完成了输入、绘制、清空和基础高清屏适配，适合作为签名板的第一版。

## 为什么使用 Pointer Events

模板只维护一套事件：

```vue
<canvas
  @pointerdown="startDrawing"
  @pointermove="draw"
  @pointerup="stopDrawing"
  @pointercancel="stopDrawing"
  @pointerleave="stopDrawing"
/>
```

Pointer Events 对鼠标、触控和手写笔提供统一接口。相比同时维护 `mousedown/touchstart` 两套逻辑，坐标处理和生命周期更一致，还能读取 `pressure`、`pointerType` 等扩展信息。

CSS 中的 `touch-action: none` 同样重要，否则触摸书写时浏览器可能优先滚动页面，而不是持续发送绘制事件。

## 客户端坐标不能直接用于绘制

`event.clientX` 和 `clientY` 相对于视口，Canvas 绘制坐标相对于画布。必须减去画布边界：

```ts
const rect = canvas.getBoundingClientRect()

return {
  x: event.clientX - rect.left,
  y: event.clientY - rect.top,
}
```

如果页面有滚动、边距或响应式布局，直接使用客户端坐标会让笔迹和指针明显错位。

当前组件通过 `setTransform` 把上下文缩放到 CSS 像素，因此这里不需要再手动乘 `devicePixelRatio`。坐标换算必须和画布缩放策略配套，重复乘倍率会造成另一种偏移。

## pointer capture 解决越界中断

```ts
canvas.setPointerCapture(event.pointerId)
```

用户按下后可能快速划出 Canvas。捕获指针后，后续事件仍会发送给当前画布，笔迹不会在边缘突然断掉。

当前模板同时在 `pointerleave` 时停止绘制，属于更保守的行为。如果希望允许短暂越界后继续书写，可以保留 capture，并主要在 `pointerup`、`pointercancel` 时结束。

## 从点到连续笔迹

开始时记录第一个点：

```ts
isDrawing = true
lastPoint = getPoint(event)
```

移动时连接上一个点和当前点：

```ts
context.beginPath()
context.moveTo(lastPoint.x, lastPoint.y)
context.lineTo(point.x, point.y)
context.stroke()
lastPoint = point
```

`lineJoin = 'round'` 与 `lineCap = 'round'` 会让线段连接处和端点更自然。输入事件频率不足时，直线段仍可能出现棱角；更平滑的版本可以取相邻点中点，使用二次贝塞尔曲线连接，或利用 `getCoalescedEvents()` 读取浏览器合并的高频轨迹。

## 高清屏为什么会模糊

CSS 决定 Canvas 在页面中显示多大，`canvas.width/height` 决定内部位图有多少像素。高分屏上，如果两者完全相同，一个内部像素可能被拉伸到多个物理像素。

当前组件根据 DPR 放大内部缓冲区：

```ts
const rect = canvas.getBoundingClientRect()
const ratio = window.devicePixelRatio || 1

canvas.width = Math.floor(rect.width * ratio)
canvas.height = Math.floor(rect.height * ratio)
context.setTransform(ratio, 0, 0, ratio, 0, 0)
```

之后业务代码仍使用 CSS 像素坐标，浏览器负责把线条绘制到更密集的内部像素上。

设置 `canvas.width` 或 `height` 会清空画布并重置上下文状态，所以尺寸变化后必须重新设置线宽、颜色和变换矩阵。

## 窗口缩放时如何保留签名

演示在调整尺寸前调用 `toDataURL()` 保存快照，重建缓冲区后再画回来。这种方式简单，但连续缩放可能反复编码 PNG，成本较高，而且位图缩放会损失精度。

更可靠的工程方案是保存原始轨迹：

```ts
interface Stroke {
  color: string
  width: number
  points: Array<{ x: number; y: number; pressure: number }>
}
```

尺寸改变时，按新比例重放所有轨迹。这样不仅能无损适配，还能支持撤销、重做、修改颜色和服务端保存。

## 清空、导出与空签名判断

清空只是擦除像素：

```ts
context.clearRect(0, 0, rect.width, rect.height)
```

如果采用轨迹模型，还应同时清空轨迹数组。导出可以使用 `canvas.toBlob()`，它比 `toDataURL()` 更适合生成文件，也不会创建很长的 Base64 字符串。

“是否为空”最好通过轨迹数量判断，而不是扫描整张位图。正式签名流程还应限制图片尺寸、校验有效笔画，并明确签名数据的隐私和存储周期。

## 小结

一个可用的 Canvas 签名板，本质上是输入采样、坐标换算、轨迹模型和位图输出的组合。当前示例完成了直接绘制版本；下一步若要支持撤销、缩放和高质量导出，应尽早从“只保存像素”升级为“保存笔迹数据并随时重放”。
