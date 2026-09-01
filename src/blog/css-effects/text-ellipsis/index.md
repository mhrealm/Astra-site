---
title: '文本省略'
description: '整理单行、多行和动态容器中的文本省略写法。'
pubDate: '2020-07-16'
category: '交互组件'
categorySlug: 'interaction'
tags: ['文本处理']
difficulty: 3
source: 'vue-practice/src/views/css-effects/text-ellipsis/index.vue'
---

> **临时说明**：本文由 AI 根据当前 `index.vue` 整理，已经补充布局前提、兼容边界和 JavaScript 测量成本，但仍不是最终发布版本。

## 省略号为什么经常“不生效”

文本省略不是给文字加一个 `...`，而是浏览器在确定“内容确实溢出”后采取的绘制策略。容器没有明确宽度、Flex 子项不允许收缩、内容本身可以无限撑开时，浏览器认为没有溢出，自然不会显示省略号。

当前演示对比了四种方案：单行 CSS、多行 line-clamp、固定高度遮罩和 JavaScript 精确截断。选择方案前，应先确认业务到底需要限制宽度、限制行数，还是需要拿到截断后的真实字符串。

## 单行省略的三个条件

```css
.ellipsis-single {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

- `white-space: nowrap` 强制内容保持一行。
- `overflow: hidden` 裁掉超出容器的部分。
- `text-overflow: ellipsis` 指定裁剪边缘使用省略号。

这三个属性必须作用在真正发生溢出的元素上。外层设置宽度、内层设置省略时，内层仍可能按内容宽度展开。

## Flex 和 Grid 中最常见的坑

Flex 子项默认 `min-width: auto`，最小宽度会参考内容宽度，长标题可能把整行撑开。通常要给承载文本的子项增加：

```css
.card-content {
  min-width: 0;
}
```

Grid 也有类似问题。轨道写成 `1fr` 时，内容最小宽度可能仍然参与计算；`minmax(0, 1fr)` 能明确允许该列收缩。

很多“省略号失效”并不是 `text-overflow` 的问题，而是父级布局没有允许文本区域变窄。

## 多行省略

当前示例使用常见的 line-clamp 组合：

```css
.ellipsis-multi {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
}
```

`-webkit-line-clamp` 在现代主流浏览器中已经非常常用，但长期以来依赖旧的 flexbox 语法，因此项目仍常同时保留带前缀的三件套。

多行省略适合固定行数的卡片摘要。它限制的是视觉行数，不会修改原始文本，也不会告诉 JavaScript 实际显示了多少字符。

## 固定高度遮罩的局限

```css
.ellipsis-generic {
  position: relative;
  height: 4.2em;
  overflow: hidden;
  line-height: 1.4;
}
```

这里 `4.2em` 等于三行 `1.4` 的行高，再通过伪元素在右下角覆盖 `...`。这种方式不依赖 line-clamp，但它并不知道最后一行是否真的溢出，因此短文本也可能出现多余省略号。

伪元素背景色还必须与容器背景一致，否则会看到明显色块。渐变、图片背景和暗色主题下，维护成本会迅速增加。

## JavaScript 截断为什么使用二分查找

JS 方案先保存原始文本，再反复写入候选长度，通过 `scrollHeight` 判断是否超过最大高度：

```ts
let start = 0
let end = originalText.length
let bestFit = 0

while (start <= end) {
  const middle = Math.floor((start + end) / 2)
  element.textContent = `${originalText.slice(0, middle)}...`

  if (element.scrollHeight > maxHeight) {
    end = middle - 1
  } else {
    bestFit = middle
    start = middle + 1
  }
}
```

从末尾逐字删除最坏需要测量 `n` 次；二分查找只需要约 `log₂n` 次。不过每次读 `scrollHeight` 都可能迫使浏览器完成布局计算，所以它仍然比纯 CSS 昂贵。

## 字符数不等于视觉宽度

中文、英文字母、数字和 emoji 的宽度不同，同样 50 个字符可能占据完全不同的行数。字体下载完成前后的字形宽度也可能变化。

因此 JS 方案只能在元素真实尺寸和最终字体已经确定后执行。当前组件在挂载后通过 `nextTick` 测量，并监听窗口 resize。更完整的实现可以使用 `ResizeObserver` 只观察目标容器，还应在 `document.fonts.ready` 后重新计算一次。

## 原始文本不能丢

如果直接把截断结果写回 `textContent`，容器变宽时无法恢复之前删掉的内容。示例把原文保存到 `data-original-text`：

```ts
const originalText = element.dataset.originalText || element.textContent || ''
element.dataset.originalText = originalText
```

每次计算前先恢复完整文本，再寻找新的最佳长度。这是动态容器中 JS 截断能够正确扩展回去的关键。

## 可访问性与交互设计

视觉省略不应让用户永远看不到完整内容。可以根据场景提供详情页、展开按钮或可聚焦的提示。不要只依赖 hover tooltip，触摸设备和键盘用户可能无法触发。

纯 CSS 截断仍保留完整 DOM 文本，屏幕阅读器通常可以读取；JS 直接替换文本则真的删除了可访问内容，需要通过 `aria-label`、隐藏全文或展开机制补回信息。

## 如何选择

- 单行标题、文件名：优先单行 CSS 省略。
- 卡片摘要、固定三行描述：优先 line-clamp。
- 兼容特殊旧环境：可以使用固定高度，但要处理短文本和背景。
- 必须获得截断后的字符串或实现“展开更多”：使用 JS，并控制测量频率。

## 小结

省略号是否可靠，首先取决于布局是否给出了明确边界，其次才是具体 CSS。能用 CSS 就不要引入 DOM 测量；必须用 JavaScript 时，要保存原文、降低重排次数，并为用户保留查看完整内容的路径。
