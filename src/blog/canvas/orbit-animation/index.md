---
title: 'Canvas 轨道动画'
description: '通过 Canvas 绘制围绕中心运动的轨道动画。'
pubDate: '2023-02-14'
category: 'Canvas 实验'
categorySlug: 'canvas'
tags: ['Canvas']
difficulty: 3
source: 'vue-practice/src/views/canvas/orbit-animation/index.vue'
---

> **临时说明**：本文由 AI 根据当前 `index.vue` 整理，已经补充时间驱动动画、嵌套坐标系和性能边界，但仍不是最终发布版本。

## Canvas 动画为什么要每帧重画

Canvas 只保存最终像素，不保存“太阳”“轨道”和“月球”这些对象。想让物体移动，不能修改某个圆的坐标，只能清除上一帧，再根据最新状态重新绘制完整画面。

当前演示每一帧依次完成：

1. 清空画布。
2. 把坐标原点移动到中心。
3. 绘制中心星体和轨道。
4. 建立行星局部坐标系并绘制行星。
5. 在行星坐标系里继续建立卫星坐标系。
6. 请求浏览器绘制下一帧。

## requestAnimationFrame 的职责

```ts
frameId = window.requestAnimationFrame(drawOrbit)
```

`requestAnimationFrame` 会在浏览器准备下一次绘制前调用回调。相比固定间隔的 `setInterval`，它更容易和屏幕刷新同步；页面进入后台时，浏览器也可以主动降低调用频率。

它并不自动循环。当前帧末尾再次调用 `requestAnimationFrame`，才形成持续动画。

## 使用时间计算位置，而不是每帧累加

示例根据真实时间计算角度：

```ts
const time = new Date()
const earthAngle =
  ((2 * Math.PI) / 60) * time.getSeconds() + ((2 * Math.PI) / 60000) * time.getMilliseconds()
```

第一项计算当前秒数对应的角度，第二项加入毫秒，让运动在一秒内部仍然连续。

如果改成每帧执行 `angle += 0.01`，运动速度会依赖帧率：高刷屏转得更快，掉帧时转得更慢。时间驱动的计算即使漏掉几帧，下一帧也会直接出现在正确位置，不会累计误差。

通用动画更适合使用 `requestAnimationFrame` 提供的高精度时间戳：

```ts
const draw = (timestamp: number) => {
  const angle = (timestamp / duration) * Math.PI * 2
}
```

## 把原点移动到画布中心

```ts
context.save()
context.translate(150, 150)
```

默认原点在左上角，围绕 `(150, 150)` 计算圆周坐标会产生大量加法。移动原点后，中心星体可以直接画在 `(0, 0)`，后面的旋转也自然围绕中心发生。

这是 Canvas 层级动画常用的做法：每个对象都在自己的局部坐标系里绘制。

## rotate + translate 如何形成公转

```ts
context.save()
context.rotate(earthAngle)
context.translate(105, 0)
drawCircle(context, 10, '#93c5fd', '#2563eb')
```

坐标系先旋转到当前角度，再沿旋转后的 X 轴移动 `105px`。局部原点因此落在轨道圆周上，在该原点绘制的圆就是行星。

直接用三角函数也能得到同样位置：

```ts
const x = Math.cos(earthAngle) * 105
const y = Math.sin(earthAngle) * 105
```

变换写法更适合有父子层级的场景，因为卫星可以继续复用当前行星坐标系。

## 嵌套 save/restore 表达层级关系

卫星位于行星坐标系内部：

```ts
context.save()
context.rotate(moonAngle)
context.translate(0, 28.5)
drawCircle(context, 3, '#f8fafc', '#94a3b8')
context.restore()
```

随后依次恢复行星和画布中心状态。每一对 `save/restore` 都对应场景树中的一层。这样修改卫星速度或距离，不会污染行星和中心星体。

## 渐变绘制的成本

`drawCircle` 每帧都会创建径向渐变：

```ts
const gradient = context.createRadialGradient(0, 0, 0, 0, 0, radius)
```

当前只有三个小圆，成本可以忽略。如果场景里有数百个粒子，重复创建渐变、路径和临时对象会增加垃圾回收压力。可以预先生成离屏 Canvas 精灵，再使用 `drawImage` 复用；或者缓存不随时间变化的背景轨道，只重绘运动对象。

优化前应先用性能面板确认瓶颈，不要为了几个圆提前引入复杂缓存。

## 清理和页面可见性

```ts
onBeforeUnmount(() => {
  window.cancelAnimationFrame(frameId)
})
```

取消最后一次排队的回调，可以防止组件离开后继续访问画布。大型动画还可以监听 `visibilitychange`：页面不可见时停止提交新帧，恢复后根据时间重新计算位置。

## 小结

这个轨道动画把 Canvas 场景组织成了一棵坐标树：中心是根节点，行星是子节点，卫星又是行星的子节点。`save/restore` 管理层级，时间决定状态，`requestAnimationFrame` 负责选择合适的绘制时机。这套结构比手动计算每个对象的绝对坐标更容易扩展。
