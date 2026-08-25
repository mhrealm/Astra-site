---
title: '异步调用和延迟执行有哪些应用？'
description: '先区分两个概念 异步调用强调“任务不会阻塞当前流程，结果稍后回来”。常见形式有 Promise 、 async/await 、事件监听、网络请求、Worker 消息等。 延迟执行强调“先不执行，等到某个时间点或条件再执行”。常见形式有 se'
pubDate: '2026-08-21'
category: 'JavaScript 实战'
categorySlug: 'javascript'
tags: ['异步']
difficulty: 2
source: 'vue-practice/src/views/javascript/async-delay/index.md'
demoSlug: 'javascript-async-delay'
demoInline: true
---

## 先区分两个概念

异步调用强调“任务不会阻塞当前流程，结果稍后回来”。常见形式有 `Promise`、`async/await`、事件监听、网络请求、Worker 消息等。

延迟执行强调“先不执行，等到某个时间点或条件再执行”。常见形式有 `setTimeout`、`requestAnimationFrame`、`requestIdleCallback`、防抖、节流、轮询、重试退避等。

二者经常组合出现：一次异步请求可能要延迟重试，一个 UI 更新可能要等下一帧再执行。

## 异步调用的应用

### 1. 网络请求

```js
async function loadUser(id) {
  const res = await fetch(`/api/users/${id}`)
  return res.json()
}
```

### 2. 并发请求

```js
const [user, orders] = await Promise.all([fetchUser(), fetchOrders()])
```

### 3. 用户交互后的异步流程

例如上传文件、提交表单、登录、支付、权限确认等。

```js
async function submit() {
  loading.value = true
  try {
    await saveForm()
  } finally {
    loading.value = false
  }
}
```

### 4. Web Worker 计算

大计算放到 Worker，避免阻塞主线程渲染。

```js
worker.postMessage({ type: 'calculate', payload })

worker.onmessage = (event) => {
  renderResult(event.data)
}
```

## 延迟执行的应用

### 1. 防抖：等用户停下来再执行

搜索框输入、窗口 resize、表单自动保存都适合防抖。

```js
function debounce(fn, delay = 300) {
  let timer

  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
```

### 2. 节流：固定间隔执行一次

滚动、拖拽、mousemove 等高频事件适合节流。

```js
function throttle(fn, delay = 300) {
  let waiting = false

  return (...args) => {
    if (waiting) return
    waiting = true
    fn(...args)
    setTimeout(() => {
      waiting = false
    }, delay)
  }
}
```

### 3. 重试和指数退避

接口临时失败时，不要立刻连续轰炸服务，可以延迟后重试。

```js
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function retry(task, times = 3) {
  for (let i = 0; i < times; i++) {
    try {
      return await task()
    } catch (error) {
      if (i === times - 1) throw error
      await sleep(2 ** i * 500)
    }
  }
}
```

### 4. 超时控制

给异步任务设置最长等待时间。

```js
function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('timeout')), ms)
  })

  return Promise.race([promise, timeout])
}
```

### 5. 下一帧执行

需要等浏览器完成一次布局或绘制时，可以使用 `requestAnimationFrame`。

```js
requestAnimationFrame(() => {
  measureElement()
  startAnimation()
})
```

### 6. 空闲时执行

不紧急的统计、预加载、缓存清理，可以放到浏览器空闲时执行。

```js
requestIdleCallback(() => {
  prefetchNextPage()
})
```

## 组合场景

- 搜索联想：输入防抖，然后异步请求。
- 无限滚动：滚动节流，然后异步加载下一页。
- 接口容错：异步请求失败后延迟重试。
- 动画启动：DOM 更新后延迟到下一帧读取尺寸。
- 大任务拆片：用延迟切片让主线程有机会响应用户操作。
- 轮询任务：延迟一段时间后继续发起下一次异步请求。

## 核心判断

如果问题是“我不想阻塞当前流程”，考虑异步调用。

如果问题是“我现在不想立刻执行”，考虑延迟执行。

如果问题是“既要等结果，又要控制执行时机”，通常需要把两者组合起来。
