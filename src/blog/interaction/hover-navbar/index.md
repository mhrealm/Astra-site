---
title: '如何实现一个 Hover 高亮导航？'
description: '最近浏览网页时看到一个很有意思的导航效果：当鼠标 hover 到某一项时，导航背景会从当前项的位置出现，并平滑移动到对应菜单项下面；当鼠标离开时，背景会收缩到当前项中心并消失。'
pubDate: '2026-08-10'
category: '交互组件'
categorySlug: 'interaction'
tags: ['导航']
difficulty: 3
source: 'vue-practice/src/views/interaction/hover-navbar/index.md'
demoSlug: 'interaction-hover-navbar'
demoInline: true
---

## 前言

最近浏览网页时看到一个很有意思的导航效果：当鼠标 hover 到某一项时，导航背景会从当前项的位置出现，并平滑移动到对应菜单项下面；当鼠标离开时，背景会收缩到当前项中心并消失。

这个效果看起来像是每个菜单项都有自己的 hover 背景，但实际上更适合拆成两层：

1. 底部放一个统一的高亮背景块；
2. 鼠标经过不同菜单项时，只改变这个背景块的位置、尺寸和透明度。

这样做的好处是，背景从一个菜单项移动到另一个菜单项时，会天然产生“跟随移动”的感觉。

## DOM 结构

当前组件的 DOM 很简单：

```vue
<template>
  <main class="hover-navbar-page">
    <nav ref="navRef" class="hover-highlight-nav">
      <div class="menu-bg" :style="dynamicStyles"></div>

      <ul class="menu-list">
        <li
          v-for="item in menuList"
          :key="item"
          class="menu-item"
          @mouseenter="handleMouseEnter"
          @mouseleave="handleMouseLeave"
        >
          <span class="menu-label">{{ item }}</span>
        </li>
      </ul>
    </nav>
  </main>
</template>
```

这里真正负责动画的是 `.menu-bg`，它是一个绝对定位的元素。

菜单文字本身并不负责背景动画，只负责提供一个可以测量的位置区域，也就是 `.menu-label`。

## 准备菜单数据

菜单项通过数组渲染：

```ts
const menuList = ['$CTRL', 'Support', 'Security', 'Resources']
```

这样后续如果要增加或减少导航项，只需要调整数组，不需要重复写 DOM。

## 保存高亮块状态

高亮块需要记录五个值：

```ts
const highlightRect = ref({
  width: 0,
  height: 0,
  left: 0,
  top: 0,
  opacity: 0,
})
```

它们分别对应：

1. `width`：高亮块宽度；
2. `height`：高亮块高度；
3. `left`：高亮块相对导航容器的左侧位置；
4. `top`：高亮块相对导航容器的顶部位置；
5. `opacity`：控制显示和隐藏。

然后通过 `computed` 转成可以直接绑定到模板上的样式：

```ts
const dynamicStyles = computed<CSSProperties>(() => ({
  width: `${highlightRect.value.width}px`,
  height: `${highlightRect.value.height}px`,
  left: `${highlightRect.value.left}px`,
  top: `${highlightRect.value.top}px`,
  opacity: highlightRect.value.opacity,
}))
```

模板中这行代码会把状态实时同步给 `.menu-bg`：

```vue
<div class="menu-bg" :style="dynamicStyles"></div>
```

## 获取当前菜单文字

鼠标事件绑定在 `.menu-item` 上，但真正需要测量的是里面的 `.menu-label`。

所以先写一个方法，从当前触发事件的菜单项中找到对应的文字节点：

```ts
const getMenuLabel = (event: MouseEvent) => {
  const target = event.currentTarget

  if (!(target instanceof HTMLElement)) {
    return null
  }

  const label = target.querySelector('.menu-label')

  return label instanceof HTMLElement ? label : null
}
```

这里用的是 `event.currentTarget`，而不是 `event.target`。

因为 `target` 可能是鼠标实际命中的子元素，而 `currentTarget` 一定是当前绑定事件的 `.menu-item`，这样拿节点会更稳定。

## 计算相对位置

`.menu-bg` 是放在 `nav` 里面做绝对定位的，所以它的 `left` 和 `top` 不能直接使用页面坐标，而是要计算成相对 `nav` 的位置。

```ts
const getRelativeRect = (target: HTMLElement) => {
  const navRect = navRef.value?.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()

  if (!navRect) {
    return null
  }

  return {
    width: targetRect.width,
    height: targetRect.height,
    left: targetRect.left - navRect.left,
    top: targetRect.top - navRect.top,
  }
}
```

可以简单理解成：

```txt
高亮块 left = 菜单文字距离页面左侧的位置 - nav 距离页面左侧的位置
高亮块 top  = 菜单文字距离页面顶部的位置 - nav 距离页面顶部的位置
```

这样无论导航出现在页面哪个位置，高亮块都能准确覆盖到当前菜单文字区域。

## 鼠标进入时

当鼠标进入菜单项时，先拿到当前 `.menu-label` 的位置和尺寸，然后把这些值赋给 `highlightRect`：

```ts
const handleMouseEnter = (event: MouseEvent) => {
  const label = getMenuLabel(event)
  const rect = label ? getRelativeRect(label) : null

  if (!rect) {
    return
  }

  highlightRect.value = {
    ...rect,
    opacity: 1,
  }
}
```

这时 `.menu-bg` 会变成当前菜单文字的宽高，并移动到对应位置。

由于 CSS 中给 `.menu-bg` 设置了 transition，所以这个变化不是瞬间完成的，而是会平滑过渡。

## 鼠标离开时

鼠标离开时，不是简单地把透明度变成 `0`，而是让高亮块先收缩到当前菜单文字的中心，再消失：

```ts
const handleMouseLeave = (event: MouseEvent) => {
  const label = getMenuLabel(event)
  const rect = label ? getRelativeRect(label) : null

  if (!rect) {
    highlightRect.value.opacity = 0
    return
  }

  highlightRect.value = {
    width: 0,
    height: 0,
    left: rect.left + rect.width / 2,
    top: rect.top + rect.height / 2,
    opacity: 0,
  }
}
```

这里的关键是：

```ts
left: rect.left + rect.width / 2,
top: rect.top + rect.height / 2,
```

也就是把高亮块的位置设置到当前菜单项的中心点。

因为宽高同时变成了 `0`，视觉上就会产生“从当前位置缩小消失”的效果。

## 样式部分

高亮块本身是绝对定位：

```css
.hover-highlight-nav {
  position: relative;
}

.menu-bg {
  position: absolute;
  z-index: 1;
  border-radius: 999px;
  background-color: #d1d6d2;
  pointer-events: none;
  transition: all 0.4s ease;
}
```

这里有几个细节：

1. `.hover-highlight-nav` 设置 `position: relative`，让 `.menu-bg` 可以基于导航容器定位；
2. `.menu-bg` 设置 `pointer-events: none`，避免高亮块挡住鼠标事件；
3. `transition: all 0.4s ease` 负责让宽高、位置和透明度一起过渡；
4. `z-index: 1` 让背景在文字下面。

文字需要盖在背景上方：

```css
.menu-label {
  position: relative;
  z-index: 2;
  display: block;
  padding: 14px 40px;
  border-radius: 999px;
}
```

这里使用固定间距配合小屏断点即可，避免用视口宽度参与计算后把页面撑出横向滚动。

## 分隔线

菜单项之间的分隔线是通过伪元素实现的：

```css
.menu-item:not(:last-of-type) .menu-label::after {
  content: '';
  position: absolute;
  top: 50%;
  right: -8px;
  width: 4px;
  height: 50%;
  background-color: rgb(117, 116, 116);
  transform: translateY(-50%);
}
```

这样不需要额外增加 DOM，也能保持结构比较干净。

## 移动端适配

在小屏幕下，导航从横向变成纵向：

```css
@media (max-width: 720px) {
  .hover-navbar-page {
    align-items: flex-start;
  }

  .menu-list {
    display: flex;
    width: min(100%, 360px);
    flex-direction: column;
  }

  .menu-label {
    padding-right: 28px;
    padding-left: 28px;
  }

  .menu-item:not(:last-of-type) .menu-label::after {
    right: auto;
    bottom: -8px;
    left: 50%;
    top: auto;
    width: 50%;
    height: 2px;
    transform: translateX(-50%);
  }
}
```

这里不仅改变了菜单排列方向，也同步调整了分隔线的位置：

横向导航时，分隔线在菜单项右侧；纵向导航时，分隔线移动到底部。

## 完整逻辑回顾

整个效果的核心流程是：

1. 页面中只放一个 `.menu-bg` 作为高亮背景；
2. 鼠标进入菜单项时，测量 `.menu-label` 的宽高和位置；
3. 把测量结果转换成相对 `nav` 的坐标；
4. 更新 `highlightRect`；
5. `dynamicStyles` 自动同步到 `.menu-bg`；
6. CSS transition 负责完成平滑动画；
7. 鼠标离开时，把高亮块宽高设为 `0`，位置设为当前菜单项中心点，让它收缩消失。

这个效果并不依赖 GSAP，也不需要复杂的动画库。只要把“高亮背景”从菜单项里抽离出来，变成一个独立的、可移动的元素，剩下的事情就是测量位置和更新样式。
