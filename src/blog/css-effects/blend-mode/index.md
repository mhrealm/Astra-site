---
title: '混合模式'
description: '演示 CSS mix-blend-mode 的视觉叠加效果。'
pubDate: '2020-12-22'
category: 'CSS 布局与效果'
categorySlug: 'css-effects'
tags: ['混合模式']
difficulty: 2
source: 'vue-practice/src/views/css-effects/blend-mode/index.vue'
---

> **临时说明**：本文由 AI 根据当前 `index.vue` 整理，已经补充混合模式的图层关系、隔离边界和可读性问题，但仍不是最终发布版本。

## 混合模式在混合什么

普通元素绘制时会覆盖它下面的内容。`mix-blend-mode` 会让当前元素的像素与背后已经绘制的像素参与颜色运算，再输出最终颜色。

```css
.title {
  mix-blend-mode: difference;
}
```

这里的“背后”不是元素自己的 `background`，而是与它发生叠放的父级、兄弟元素或更下层内容。背景变化时，文字结果也会实时变化，因此混合模式常用于海报标题、图片蒙版和动态视觉设计。

## mix-blend-mode 与 background-blend-mode

两者名字相近，但作用对象不同：

- `mix-blend-mode`：当前元素整体与背后的内容混合。
- `background-blend-mode`：同一个元素内部的多层背景图片和背景色互相混合。

如果想让文字颜色与图片发生反差，通常用 `mix-blend-mode`；如果只是把一张纹理叠在渐变背景上，用 `background-blend-mode` 更直接。

## 当前演示如何切换模式

组件把模式保存在响应式状态中：

```ts
const modes = ['normal', 'multiply', 'screen', 'overlay', 'difference', 'color-dodge', 'luminosity']

const activeMode = ref('difference')
```

模板通过 CSS 自定义属性把运行时状态交给样式层：

```vue
<div class="blend-preview" :style="{ '--blend-mode': activeMode }">
  <span>BLEND</span>
</div>
```

```css
.blend-preview span {
  mix-blend-mode: var(--blend-mode);
}
```

相比为每个模式定义一个 class，CSS 变量减少了重复规则，也让选择框和按钮共用同一份状态。

## 常用模式怎么选

### multiply

结果通常比原图更暗，白色接近透明效果，适合阴影、纸张纹理和线稿叠加。多层 multiply 很容易让暗部失去细节。

### screen

结果通常更亮，黑色接近透明效果，适合光斑、烟雾和高光素材。浅色背景上可能几乎看不出变化。

### overlay

综合 multiply 与 screen，暗部更暗、亮部更亮，提高对比度。效果强烈，但肤色和品牌色可能被明显改变。

### difference

对两层颜色求差，黑色背景基本保留前景颜色，白色背景会得到反色。它能制造醒目的反差，但不保证任何背景下都适合阅读。

### luminosity

保留混合层的亮度信息，并从背景继承色相和饱和度。适合需要保留明暗结构、重新着色的场景。

这些描述只是视觉直觉。混合计算按颜色通道进行，最终结果还会受到透明度、色彩空间和浏览器合成方式影响。

## 为什么需要 isolation

混合元素可能一路与祖先背后的页面内容发生混合，结果超出组件边界。给预览容器创建独立隔离组可以控制范围：

```css
.blend-preview {
  isolation: isolate;
}
```

隔离后，容器内部元素只与当前堆叠上下文中的背景混合，不会意外影响页面其他区域。当前示例的页面结构较简单；做成可复用组件时建议明确增加这一层边界。

某些属性，例如 `transform`、`filter`、`opacity` 和定位层级，也可能创建新的堆叠上下文并改变混合结果。遇到“相同 CSS 在另一个页面失效”时，应先检查层叠上下文，而不是继续提高 `z-index`。

## 为什么模式标签必须恢复 normal

预览中的大标题使用动态混合模式，但右下角的模式名称设置为：

```css
.blend-preview strong {
  mix-blend-mode: normal;
}
```

这是在建立信息层级：装饰性标题可以参与混合，描述当前状态的文字必须稳定可读。真实页面中，按钮、价格、表单和正文都不应依赖不可预测的混合结果。

## 性能和可访问性

混合模式需要浏览器把多个图层合成后再计算颜色。单个静态标题通常没有问题，但大面积混合、动画背景、滤镜和模糊叠加时可能增加 GPU 内存与合成成本。

性能之外，更大的风险是对比度。设计稿里看起来醒目的 difference 文字，在某些图片区域可能突然接近背景色。业务内容应准备普通颜色作为回退，并在真实素材和不同屏幕上检查对比度。

## 小结

混合模式不是一套固定滤镜，而是一种图层关系。使用前先确定谁是混合层、谁是背景层、混合范围到哪里，再决定具体模式。装饰效果可以大胆，承载信息的文字则要保持稳定和可读。
