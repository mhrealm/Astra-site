---
title: '上拉加载下拉刷新'
description: '1. 边缘检查： if (containerRef.current.scrollTop 0) return; 这一行代码的作用是判断用户是否滚动，只有用户处于最顶部的时候才触发上拉加载，防止用户在页面中间向上滚动的过程中触发触发下拉效果。 '
pubDate: '2021-12-03'
category: '交互组件'
categorySlug: 'interaction'
tags: ['列表加载']
difficulty: 2
source: 'vue-practice/src/views/interaction/load-refresh/index.md'
demoSlug: 'interaction-load-refresh'
demoVariants:
  - slug: 'load-refresh-v1'
    title: '上拉加载下拉刷新'
    description: '移动端列表的下拉刷新和上拉加载组合版本。'
    component: 'version-1.vue'
  - slug: 'load-refresh-v2'
    title: '上拉加载'
    description: '聚焦触底加载更多数据的移动端列表版本。'
    component: 'version-2.vue'
---

## 上拉加载

### 代码分析

```js
// 监听用户手指滑动的位移
const handleTouchMove = (e) => {
  if (containerRef.current.scrollTop > 0) return
  const diff = e.touches[0].pageY - startY.current
  if (diff > 0) {
    setPullDistance(Math.pow(diff, 0.8))
  }
}
```

1. **边缘检查：**`if (containerRef.current.scrollTop > 0) return;` 这一行代码的作用是判断用户是否滚动，只有用户处于最顶部的时候才触发上拉加载，防止用户在页面中间向上滚动的过程中触发触发下拉效果。

2. **位移计算：**`const diff = e.touches[0].pageY - startY.current;` 这里的diff是手指的滑动距离。如果 diff > 0，说明用户正在向下滑动。

3. **阻尼算法：**`setPullDistance(Math.pow(diff, 0.8));` 这里使用了**幂函数（Math.pow）**来实现阻尼感，指数 0.8 会让增加的距离越来越小。这给用户一种“越拉越沉”的物理反馈，模拟了橡皮筋的拉伸感。

## 下拉刷新
