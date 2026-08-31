---
title: '滑动交互'
description: '实现移动端列表项左滑删除的交互效果。'
pubDate: '2022-08-27'
category: '交互组件'
categorySlug: 'interaction'
tags: ['滑动']
difficulty: 3
source: 'vue-practice/src/views/interaction/slide/index.vue'
---

> **临时说明**：本文由 AI 根据当前 `index.vue` 整理，已经补充手势方向判断、状态建模和移动端事件冲突，但仍不是最终发布版本。

## 左滑删除的两层结构

移动端列表项通常不是把删除按钮“滑进来”，而是让内容层移走，露出早已放在底层的操作区。

```vue
<div class="list-item">
  <div
    class="content-wrapper"
    :style="{ transform: `translateX(${swipeState[item.id] || 0}px)` }"
  >
    <!-- 正常内容 -->
  </div>
  <button class="delete-btn" type="button">删除</button>
</div>
```

`.delete-btn` 绝对定位在右侧，`.content-wrapper` 位于更高层级。默认偏移为 0 时按钮被遮住；内容向左移动 `60px` 后，按钮完整露出。

这种结构比动态修改列表项宽度稳定，因为内容层只做 transform，不会推动相邻元素重新布局。

## 为什么状态按 item.id 保存

```ts
const swipeState = reactive<Record<number, number>>({})
```

每个列表项都有独立偏移量。使用 `id` 而不是数组下标，可以避免删除一项后下标变化，导致展开状态错误地转移到另一条数据。

如果产品规定同一时间只能展开一项，其实可以简化为：

```ts
const openedId = ref<number | null>(null)
const dragOffset = ref(0)
```

离散的“谁已打开”和连续的“正在拖多远”分开后，状态更容易推断。

## 触摸开始：建立当前手势

```ts
const handleTouchStart = (event: TouchEvent, id: number) => {
  startX = event.touches[0]?.clientX ?? 0
  currentSwipeId = id
}
```

除了 `startX`，完整实现还应记录 `startY`、开始时间和项目原始偏移。它们分别用于判断手势方向、计算滑动速度和处理已经展开的项目。

只读取 `touches[0]` 意味着忽略多指操作，对列表手势通常是合理的；使用 Pointer Events 则可以通过 `pointerId` 更明确地追踪某一根手指或鼠标。

## 移动过程：计算增量并限制范围

当前实现每次取本次移动增量，加到已有位置：

```ts
const diffX = currentX - startX
const currentPosition = swipeState[id] || 0
const nextPosition = Math.max(-60, Math.min(currentPosition + diffX, 0))

swipeState[id] = nextPosition
startX = currentX
```

`Math.min(..., 0)` 禁止向右滑过初始位置，`Math.max(-60, ...)` 限制最多露出一个按钮宽度。

移动阶段不应使用 CSS transition，否则元素会一直追赶手指。当前样式始终带 transition，快速拖动时可能有轻微黏滞。更完整的实现会在 dragging 状态关闭 transition，只在松手吸附时重新开启。

## 必须区分横向滑动和纵向滚动

如果用户想上下滚动列表，手指不可避免会有少量横向偏移。没有方向锁时，列表项会跟着抖动，页面滚动也可能受阻。

常见判断方式是先等待移动距离超过阈值，再锁定方向：

```ts
const deltaX = currentX - startX
const deltaY = currentY - startY

if (!gestureAxis && Math.hypot(deltaX, deltaY) > 8) {
  gestureAxis = Math.abs(deltaX) > Math.abs(deltaY) ? 'x' : 'y'
}
```

只有锁定为横向后才更新 `translateX`；锁定为纵向时完全交给页面滚动。是否调用 `preventDefault()` 也应在方向确定后决定，不能一开始就阻止所有触摸行为。

## 松手后的吸附

当前规则以按钮宽度的一半为阈值：

```ts
swipeState[id] = (swipeState[id] || 0) < -30 ? -60 : 0
```

这种距离判断简单稳定。更接近原生交互的做法会同时考虑速度：即使只移动了 `20px`，如果用户快速向左甩动，也可以展开；缓慢拖到 `35px` 再回拉，则可能收起。

无论用距离还是速度，松手后都应把连续位置归一化为两个稳定状态：`0` 或 `-actionWidth`。

## 点击事件和滑动事件会互相影响

移动端完成 touch 后，浏览器可能继续触发一个 click。当前列表项上的 `@click="resetSwipeState"` 可能在刚展开后立即把它收起，具体表现取决于移动距离和浏览器事件合成。

生产实现应记录本次手势是否真的移动过，移动超过阈值后抑制随后的 click；“点击空白处收起”更适合绑定在列表外层，并判断目标是否属于当前展开项。

## 删除时为什么还要清理状态

```ts
const handleDelete = (id: number) => {
  listData.value = listData.value.filter((item) => item.id !== id)
  delete swipeState[id]
}
```

数据删除后，对应偏移状态也应删除。否则长时间操作列表会留下越来越多无效 key。实际业务还需要处理接口失败：可以先乐观删除，失败后恢复；也可以按钮进入 loading，接口成功后再移除。

删除是破坏性操作，是否二次确认取决于恢复成本。支持撤销 toast 往往比弹窗确认更流畅，也能降低误删风险。

## 可访问性和桌面端

滑动是隐藏手势，用户不一定知道它存在。删除按钮应能通过键盘聚焦，并考虑在桌面端直接显示菜单按钮。不能把关键操作只放在手势里。

改用 Pointer Events 后，鼠标拖拽和触摸可以复用同一套逻辑；但桌面端更符合预期的交互通常仍是明确按钮，而不是要求用户猜测可拖动。

## 小结

左滑删除的视觉实现只有一个 transform，真正复杂的是手势状态机：识别方向、限制范围、松手吸附、处理合成 click，并保证数据和偏移状态一起清理。把这些边界补齐后，它才是一个可以放进真实列表的交互，而不是只能在单个示例里工作的动画。
