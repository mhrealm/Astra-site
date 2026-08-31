---
title: 'jQuery 交互动效'
description: '用 jQuery 实现随机边框、hover 放大、元素移动和打字机效果。'
pubDate: '2020-09-08'
category: '交互组件'
categorySlug: 'interaction'
tags: ['jQuery']
difficulty: 2
source: 'vue-practice/src/views/interaction/jquery-effects/index.vue'
---

> **临时说明**：本文由 AI 根据当前 `index.vue` 整理，重点补充 jQuery 与 Vue 共存时的 DOM 所有权和清理策略，但仍不是最终发布版本。

## 为什么 Vue 项目里还要讨论 jQuery

新项目通常没有必要同时引入 Vue 和 jQuery，但维护后台系统、活动页或逐步迁移的旧项目时，这种组合很常见。问题不在于 jQuery “能不能用”，而在于谁负责管理同一个 DOM。

当前演示保留四种典型 jQuery 写法：修改样式、hover 放大、队列动画和打字机计时。它更适合当作迁移边界示例，而不是推荐的新项目架构。

## 把查询范围限制在组件内部

```js
const $page = $(pageRef.value)
```

后续选择器都从 `$page.find(...)` 开始，而不是直接使用 `$('.demo-button')`。这样页面存在多个相同组件时，不会一次选中所有实例；样式和事件也不会泄漏到站点其他区域。

这种“根节点作用域”是任何第三方 DOM 库接入组件框架时的最低要求。图表、富文本编辑器和地图 SDK 同样应该只接管传给它的容器。

## 随机边框色：命令式更新

```js
$page.find('.color-button').on('click.jqueryEffects', function () {
  $(this).css({ borderColor: getRandomColor() })
})
```

这里状态只存在于 DOM 的内联样式中，Vue 并不知道当前颜色。如果组件之后因为条件渲染替换了按钮，这个颜色会直接丢失。

Vue 写法通常会把颜色保存成 `ref`，再通过 `:style` 渲染。这样颜色可以被重置、序列化和测试。jQuery 写法短，但状态来源不再唯一。

## hover 放大为什么更适合 CSS

演示使用 `mouseenter` 和 `mouseleave` 修改 `transform`，用于展示事件 API：

```js
$image.on('mouseenter.jqueryEffects', function () {
  $(this).css({ transform: 'scale(1.18)' })
})
```

如果效果只与 hover 状态有关，纯 CSS 更简单：

```css
.zoom-image:hover {
  transform: scale(1.18);
}
```

JavaScript 版本适合进入时还要请求数据、同步其他组件或按业务条件决定动画的场景。没有业务状态时，不必把 CSS 能完成的事情交给事件回调。

## animate 队列为什么要先 stop

```js
$moveBox.stop(true).animate({ left: '+=50px' }, 500)
```

jQuery `animate` 默认会把连续动画加入队列。用户快速点击十次，元素可能在停止点击后仍然移动很久。`stop(true)` 会停止当前动画并清空等待队列，让新的点击立即接管。

当前代码修改 `left`，要求元素使用定位，并且可能触发布局计算。现代实现更适合动画 `transform: translateX(...)`；如果保留 jQuery，也可以用状态计算位置，再让 CSS transition 负责过渡。

## 打字机效果其实是一个可取消任务

```js
let index = 0
window.clearTimeout(typingTimer)
$typingText.text('')

const typeText = () => {
  if (index >= typingContent.length) return
  $typingText.append(typingContent.charAt(index))
  index += 1
  typingTimer = window.setTimeout(typeText, 100)
}
```

再次点击前先清理旧计时器，否则两条递归链会同时写入同一个元素，出现重复字符和错序。组件卸载时也要清理，因为定时器的生命周期不会自动跟随 Vue 组件。

逐字符更新 DOM 对短句影响不大。长内容可以根据时间计算当前应显示的字符数，或用 CSS `steps()` 实现视觉打字效果，减少回调数量。

## 事件命名空间解决了什么

```js
.on('click.jqueryEffects', handler)
```

点号后面的 `jqueryEffects` 是 jQuery 事件命名空间。卸载时可以只移除当前模块的监听：

```js
$page.find('*').off('.jqueryEffects')
```

如果直接调用 `off('click')`，可能误删其他模块绑定在同一元素上的 click 事件。命名空间对旧项目尤其重要，它相当于给事件增加了可追踪的所有者。

## Vue 和 jQuery 的所有权边界

可以使用下面的原则判断是否容易出问题：

- jQuery 只操作一个 Vue 不再更新的独立容器，风险较低。
- jQuery 修改 class 或 style，而 Vue 同时绑定相同属性，最后写入的一方会覆盖另一方。
- jQuery 插入或删除由 `v-for/v-if` 管理的节点，下一次 Vue 更新可能直接重建。
- 需要反映到业务状态的数据，应回到 Vue 的响应式状态，而不是只留在 DOM。

迁移旧页面时，可以先用组件根节点隔离，再逐个把“DOM 中的状态”提取为 `ref/computed`，最后删除 jQuery 事件。

## 小结

这个示例的价值不只是复习 `.on()`、`.css()` 和 `.animate()`，而是展示命令式 DOM 代码接入组件生命周期时必须补上的约束：查询要有作用域、任务要可取消、事件要有命名空间、组件卸载要清理。守住这些边界，旧代码才能被安全地逐步迁移。
