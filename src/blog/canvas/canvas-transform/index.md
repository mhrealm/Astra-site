---
title: 'Canvas 变形'
description: '演示 Canvas 坐标变换和绘制状态切换。'
pubDate: '2021-10-05'
category: 'Animation'
categorySlug: 'animation'
tags: ['Canvas']
difficulty: 2
source: 'vue-practice/src/views/canvas/canvas-transform/index.vue'
---

> **临时说明**：本文由 AI 根据当前 `index.vue` 整理。当前演示重点是变换之前必须掌握的“绘图状态栈”，文中同时补充坐标矩阵原理；仍不是最终发布版本。

## 先说明当前演示的边界

文章名称是 Canvas 变形，但当前 `index.vue` 还没有直接调用 `translate`、`rotate` 或 `scale`。它先展示了更基础、也更容易被忽略的 `save()` 与 `restore()`。

这不是同一件事，但二者密切相关：Canvas 的当前变换矩阵也是绘图状态的一部分。没有状态栈，复杂场景里的局部旋转和缩放很快会污染后续图形。

## Canvas 是一支带状态的画笔

2D 上下文会持续保存一组状态，包括：

- `fillStyle`、`strokeStyle` 和 `lineWidth`。
- `globalAlpha` 与混合模式。
- 字体、阴影和裁剪区域。
- 当前坐标变换矩阵。

修改这些属性不会只影响下一条命令，而会一直生效。`save()` 会把当前整组状态压入栈中，`restore()` 则弹出最近保存的一组状态。

## 当前示例逐步发生了什么

先绘制黑色底层：

```ts
context.fillStyle = '#111827'
context.fillRect(0, 0, 150, 150)
context.save()
```

此时状态栈顶保存的是黑色、不透明、默认变换矩阵。

接着把填充色改成蓝色并再次保存：

```ts
context.fillStyle = '#0099ff'
context.fillRect(15, 15, 120, 120)
context.save()
```

最后修改透明度，绘制白色矩形：

```ts
context.fillStyle = '#fff'
context.globalAlpha = 0.5
context.fillRect(30, 30, 90, 90)
```

两个 `restore()` 会按后进先出的顺序恢复蓝色状态和黑色状态。已经画到画布上的像素不会被撤销；恢复的只是“接下来用什么状态继续画”。这是初学者最容易误解的地方。

## save/restore 不是撤销功能

下面的代码不会删除半透明白色矩形：

```ts
context.restore()
```

要撤销像素，只能清空并根据历史数据重新绘制。`restore()` 更像恢复画笔设置，而不是图像编辑器里的 Ctrl+Z。

## 坐标变换本质是矩阵累乘

默认坐标系原点在左上角。`translate`、`rotate` 和 `scale` 并不是移动已经画好的像素，而是修改后续绘制使用的坐标矩阵。

例如围绕矩形中心旋转，通常需要：

```ts
context.save()
context.translate(centerX, centerY)
context.rotate(Math.PI / 4)
context.fillRect(-width / 2, -height / 2, width, height)
context.restore()
```

先把原点移动到图形中心，再旋转坐标系，最后用负的半宽半高让矩形中心落在原点。绘制结束后恢复状态，后面的图形仍使用默认坐标系。

如果直接 `rotate`，旋转中心会是画布原点，而不是图形自身中心。

## 变换顺序为什么重要

矩阵运算不满足交换律：

```ts
context.translate(100, 0)
context.rotate(Math.PI / 4)
```

和下面的顺序不会得到相同结果：

```ts
context.rotate(Math.PI / 4)
context.translate(100, 0)
```

前者先建立平移后的局部坐标系，再旋转；后者平移方向本身已经被旋转。遇到位置不符合预期时，应把每一次变换理解成“修改坐标轴”，而不是“移动图形”。

## 为什么局部绘制最好形成固定模板

复杂 Canvas 代码可以统一成下面的结构：

```ts
context.save()
try {
  // 设置局部样式、裁剪和坐标变换
  // 绘制当前对象
} finally {
  context.restore()
}
```

JavaScript 中很少有人为绘制代码使用 `try/finally`，但如果中间逻辑可能抛错，这能保证状态仍被恢复。至少要保持每个 `save()` 都有对应的 `restore()`，否则状态栈会不断增长，后续绘制也会越来越难推断。

## 重置矩阵

当绘制函数可能被多次调用时，可以在开头明确重置：

```ts
context.setTransform(1, 0, 0, 1, 0, 0)
```

如果还要适配 DPR，则应重置到对应缩放矩阵，而不是盲目调用 `scale()`。重复调用 `scale(2, 2)` 会累乘成 4 倍、8 倍，这是很多缩放后画面消失的根源。

## 小结

当前演示虽然只画了三层矩形，却建立了 Canvas 变形最重要的前提：变换矩阵属于可保存和恢复的绘图状态。记住“保存局部环境、修改坐标系、绘制、恢复”这四步，旋转仪表盘、层级场景和轨道动画都会更容易组织。
