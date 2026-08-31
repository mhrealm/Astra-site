---
title: '滚动加载'
description: '监听滚动容器触底状态，模拟分页加载更多数据。'
pubDate: '2022-04-19'
category: '交互组件'
categorySlug: 'interaction'
tags: ['列表加载']
difficulty: 2
source: 'vue-practice/src/views/interaction/refresh/index.vue'
---

> **临时说明**：本文由 AI 根据当前 `index.vue` 整理，已经补充分页状态、并发控制和 IntersectionObserver 方案，但仍不是最终发布版本。

## 无限滚动不是只有一个触底公式

无限滚动需要同时处理滚动检测、分页请求、结果合并、重复触发、错误恢复和列表结束。触底判断只是入口，真正容易出错的是请求状态机。

当前演示使用固定高度容器和模拟接口，每次加载十条数据。它适合观察基本流程，但生产版本还需要增加 `hasMore` 和错误状态。

## 三个滚动尺寸

```ts
const reachedBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 1
```

- `scrollTop`：内容顶部已经离开可视区域的距离。
- `clientHeight`：容器当前可视高度，不包含滚动条外的内容。
- `scrollHeight`：完整内容高度。

前两者相加就是当前可视区域底边在内容坐标系中的位置。它接近 `scrollHeight` 时，说明用户到达底部。

这里减去 `1` 是容差。缩放比例、子像素和浏览器取整可能让三个值不是完全相等。真实项目通常会提前 `100~300px` 加载，避免用户看到 loading 后才等待：

```ts
const threshold = 160
const reachedBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - threshold
```

## loading 是一把并发锁

滚动事件在一小段移动中可能触发很多次。请求开始后立即设置 `loading`：

```ts
const loadPage = async () => {
  if (loading.value) return

  try {
    loading.value = true
    const data = await fetchData(pageIndex.value, pageSize)
    items.value = [...items.value, ...data]
  } finally {
    loading.value = false
  }
}
```

这能防止同一页被并发请求多次。`finally` 必须保留，否则接口抛错后 loading 永远不会恢复，列表也无法重试。

如果请求可以被筛选条件替换，仅靠 loading 还不够。旧筛选请求可能比新请求晚返回，需要使用 `AbortController` 取消旧请求，或者比较请求版本号后再写入结果。

## 页码应该什么时候递增

当前演示在触底时先执行：

```ts
pageIndex.value += 1
loadPage()
```

模拟接口总会返回十条数据，因此看不出问题。真实接口如果第二页失败，页码已经变成 2；用户再次触底可能直接请求第三页，第二页数据被跳过。

更稳妥的方式是把下一页作为局部变量，请求成功后再提交：

```ts
const nextPage = pageIndex.value + 1
const data = await fetchData(nextPage, pageSize)

items.value.push(...data)
pageIndex.value = nextPage
```

如果后端支持游标分页，应保存响应返回的 `nextCursor`，不要用数组长度或前端页码猜测下一批数据。

## 必须有 hasMore

当接口返回空数组或 `nextCursor = null` 时，应进入结束状态：

```ts
const hasMore = ref(true)

if (data.length < pageSize) {
  hasMore.value = false
}
```

触底处理首先检查 `loading || !hasMore`。否则用户停在列表底部时，滚动事件和布局变化可能不断发送无意义请求。

页面需要区分至少四种状态：首次加载、加载更多、加载失败、没有更多。把它们全部显示成 `loading...` 会让用户不知道列表到底发生了什么。

## scroll 事件还是 IntersectionObserver

手动计算滚动尺寸便于理解原理，但还要考虑节流和滚动容器。另一种常见方案是在列表尾部放一个哨兵元素：

```vue
<div ref="sentinelRef" class="load-sentinel"></div>
```

使用 `IntersectionObserver` 观察哨兵进入容器：

```ts
observer = new IntersectionObserver(loadMore, {
  root: listRef.value,
  rootMargin: '0px 0px 160px 0px',
})
```

它把“底部是否接近可视区”的判断交给浏览器，代码通常更清晰。无论使用哪种方案，请求锁、hasMore 和错误恢复仍然不能省略。

## 数据量变大之后

无限滚动只解决分批获取数据，不会减少已经渲染的 DOM。加载几百页后，节点仍会持续增加。对于长列表，应同时考虑虚拟滚动、回收旧页面或设置合理的数据上限。

还要保存滚动位置。用户进入详情再返回时，如果列表重新从第一页加载，体验会非常差。可以缓存分页数据与 `scrollTop`，等 DOM 恢复后再还原位置。

## 小结

可靠的无限滚动是一套分页状态机：接近底部时尝试加载，加载中拒绝重复请求，成功后提交页码，失败时允许重试，没有更多时彻底停止。先把这些状态理顺，再选择 scroll 计算或 IntersectionObserver，代码才不会在真实网络环境下失控。
