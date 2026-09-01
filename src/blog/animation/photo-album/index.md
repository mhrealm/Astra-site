---
title: '相册动画'
description: '保留源项目中的立体相册入口示例。'
pubDate: '2021-06-29'
category: 'Animation'
categorySlug: 'animation'
tags: ['3D']
difficulty: 3
source: 'vue-practice/src/views/animation/photo-album/index.vue'
---

> **临时说明**：本文由 AI 根据当前 `index.vue` 整理，已补充 CSS 3D 坐标关系和响应式边界，但仍不是最终发布版本。

## 先理解相册的空间结构

这个相册没有使用 Three.js。它依靠 CSS 3D 变换，把多张卡片均匀放在一个看不见的圆柱侧面，再旋转整个圆柱，让目标卡片转到用户面前。

结构可以拆成三层：

1. `.album-stage` 是观察空间，提供 `perspective`。
2. `.album-track` 是可旋转的 3D 容器，保留子元素的空间关系。
3. `.album-card` 是围绕 Y 轴分布的每一张照片。

如果这三层职责混在一个元素上，透视和旋转中心很容易互相影响。

## 数据和空间位置分离

每张照片只保存内容，不直接保存最终角度：

```ts
const photos = [
  {
    title: '海边日落',
    year: '2021',
    description: '每张照片围绕 Y 轴摆放，通过旋转父级轨道切换当前画面。',
    background: 'linear-gradient(...)',
  },
]
```

角度由照片总数计算：

```ts
const angleStep = 360 / photos.length
```

四张照片时步长是 `90deg`，六张时是 `60deg`。数据数量改变后，排列仍能自动覆盖一整圈。

模板把每张卡片的角度写入 CSS 变量：

```vue
<li
  v-for="(photo, index) in photos"
  :style="{
    '--card-angle': `${index * angleStep}deg`,
    '--card-bg': photo.background,
  }"
></li>
```

Vue 负责计算数据，CSS 负责应用变换，两边都不需要拼接复杂 class。

## rotateY 和 translateZ 的执行顺序

卡片的核心变换是：

```css
.album-card {
  transform: rotateY(var(--card-angle)) translateZ(360px);
}
```

CSS 变换从右向左理解：卡片先沿自己的 Z 轴向外移动 `360px`，再围绕相册中心旋转。最终效果就是卡片分布在半径约为 `360px` 的圆环上。

如果写成 `translateZ(360px) rotateY(...)`，旋转会发生在卡片自己的位置，无法得到同样的环形排列。3D 布局中，变换顺序不是代码风格问题，而是不同的几何结果。

## perspective 决定观看距离

```css
.album-stage {
  perspective: 1000px;
}

.album-track {
  transform-style: preserve-3d;
}
```

`perspective` 可以理解为观察者距离屏幕平面的距离。数值越小，近大远小越明显，画面更夸张；数值越大，透视越平缓。

`transform-style: preserve-3d` 则要求浏览器保留子元素各自的 Z 轴位置。缺少它时，卡片可能被压扁到父元素平面上。

## 切换照片其实只旋转父级

点击按钮只更新索引：

```ts
const nextPhoto = () => {
  activeIndex.value = (activeIndex.value + 1) % photos.length
}
```

父级旋转角度取反：

```ts
const rotation = computed(() => -activeIndex.value * angleStep)
```

第 `n` 张卡片本身位于正方向的 `n * angleStep`，轨道反向旋转相同角度后，它正好回到面向用户的 `0deg`。所有卡片的相对位置保持不变，因此只需要给一个父元素添加 transition。

## 半径不能随便写

当前演示在桌面端使用 `translateZ(360px)`，移动端改为 `250px`。真实项目中，合理半径取决于卡片宽度和数量。如果卡片太宽或数量太多，相邻卡片会互相穿插。

近似计算可以从正多边形入手：

```text
radius ≈ cardWidth / (2 * tan(π / cardCount))
```

这个公式得到的是卡片刚好相邻的基础半径，实际还应加上卡片间距。把半径做成计算值，比为每个断点硬编码更容易维护。

## 实际图片还会带来哪些问题

- 图片应设置固定宽高或 `aspect-ratio`，避免加载后改变卡片尺寸。
- 当前面板可使用高质量图片，背面卡片可以延迟加载，减少首屏流量。
- 非当前卡片最好关闭 `pointer-events`，否则透明或背面的卡片可能截获点击。
- 可以使用 `backface-visibility: hidden` 隐藏转到背后的卡片背面。
- 自动播放必须在用户交互、页面隐藏或 `prefers-reduced-motion` 时暂停。

## 从按钮切换扩展到拖拽

拖拽版本不应在每次 `pointermove` 时直接修改索引。更自然的做法是记录起始角度，根据横向位移计算临时旋转角；松手后再按 `angleStep` 吸附到最近的一张，并同步 `activeIndex`。

这样“连续旋转角度”和“离散当前索引”各自承担一种状态，既能保持拖拽流畅，也能让按钮、指示点和键盘操作共享最终索引。

## 小结

CSS 3D 相册的关键不在动画参数，而在空间建模：观察者放在 stage，圆环放在 track，卡片通过旋转后外移形成圆柱。理解这三个坐标层级后，轮播、产品环绕展示和 3D 菜单都可以沿用同一套方法。
