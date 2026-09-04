---
title: 'Vue 3 响应式原理：从 Proxy 到依赖更新'
description: '从 Proxy、activeEffect、track、trigger 和依赖桶结构出发，讲清楚 Vue 3 reactive 如何收集依赖、触发更新，以及为什么解构后会丢失响应式访问路径。'
pubDate: '2026-09-03'
category: 'Vue'
categorySlug: 'vue'
tags: ['Vue3', '响应式', 'reactive', 'Proxy']
difficulty: 4
demoSlug: 'vue-reactivity-principle'
demoTitle: 'Vue 响应式原理调试入口'
demoDescription: '在 Vue 组件中引入手写 reactive，观察 Proxy get/set、track/trigger 与解构断联。'
---

这篇文章只讲一条主线：`reactive` 背后的响应式链路。

也就是：

```txt
对象如何被代理？
读取属性时如何收集依赖？
修改属性时如何找到依赖并触发更新？
为什么解构后会丢失响应式？
```

如果你能把这条链路想清楚，后面理解组件更新、计算属性、监听器、模板渲染都会顺很多。

## 先说结论

`reactive` 的核心不是“让变量变成响应式”，而是“让对象的属性访问变得可追踪”。

一条最小响应式链路大概是这样：

```txt
reactive(raw)
  -> 返回 Proxy

读取 proxy.count
  -> 进入 get
  -> track(raw, 'count')
  -> 记录：当前 effect 依赖 raw.count

修改 proxy.count
  -> 进入 set
  -> trigger(raw, 'count')
  -> 找到依赖 raw.count 的 effect
  -> 重新执行 effect
```

这里最关键的三个词是：

```txt
Proxy：负责拦截对象属性读取和修改。
track：读取时收集依赖。
trigger：修改时触发依赖。
```

注意，这里一直说的是“属性读取”和“属性修改”，不是“变量读取”和“变量修改”。

这是理解很多响应式问题的入口。

## Vue 追踪的不是变量

很多人第一次理解响应式时，会下意识觉得 Vue 追踪的是变量。

比如：

```js
const state = reactive({
  count: 0,
})
```

然后写：

```js
state.count
```

页面能更新，就以为 Vue 追踪的是 `count` 这个名字。

但运行时并不是这样。

JavaScript 执行 `state.count` 时，本质上是在做一次“对象属性读取”：

```txt
从 state 这个对象上读取 count 这个属性。
```

如果 `state` 是一个 Proxy，那么这次读取会被 Proxy 的 `get` 拦截。

Vue 能做的事情，就是在 `get` 里面记录：

```txt
当前正在运行的 effect，读取了这个原始对象的 count 属性。
```

所以 Vue 内部真正记录的不是：

```txt
count 这个变量被谁用过
```

而是：

```txt
某个原始对象的某个 key 被哪个 effect 读取过
```

可以把它想象成这样的关系：

```txt
rawState.count -> effectA
rawState.name  -> effectB
```

这就是“Vue 追踪的不是变量，而是访问行为”的意思。

更准确一点说，Vue 追踪的是：

```txt
effect 执行期间，经过响应式代理发生的属性访问行为。
```

只要没有经过代理对象的 `get`，Vue 就没有机会收集依赖。

## reactive 的第一步：返回 Proxy

`reactive` 接收一个普通对象，返回一个代理对象。

简化后可以写成这样：

```js
function reactive(raw) {
  return new Proxy(raw, {
    get(target, key, receiver) {
      track(target, key)
      return Reflect.get(target, key, receiver)
    },

    set(target, key, value, receiver) {
      const result = Reflect.set(target, key, value, receiver)
      trigger(target, key)
      return result
    },
  })
}
```

这里的 `raw` 是原始对象，`reactive(raw)` 返回的是代理对象。

比如：

```js
const raw = { count: 0 }
const state = reactive(raw)
```

此时：

```txt
raw   是原始对象。
state 是代理对象。
```

当你读：

```js
state.count
```

会进入 Proxy 的 `get`。

当你写：

```js
state.count = 1
```

会进入 Proxy 的 `set`。

这就是响应式系统能工作的前提：代码必须通过代理对象访问属性。

## effect：谁需要被重新执行

只有 Proxy 还不够。

Proxy 只能告诉我们：

```txt
有属性被读取了。
有属性被修改了。
```

但它不知道“谁依赖了这个属性”。

所以响应式系统还需要一个概念：`effect`。

可以把 `effect` 理解成一个需要自动重新执行的函数：

```js
effect(() => {
  console.log(state.count)
})
```

第一次执行这个函数时，会读取 `state.count`。

读取 `state.count` 会进入 Proxy 的 `get`。

`get` 里面调用 `track(target, key)`。

于是响应式系统就知道：

```txt
当前这个 effect 依赖 state.count。
```

之后只要执行：

```js
state.count++
```

就会进入 Proxy 的 `set`，然后调用 `trigger(target, key)`，找到前面收集过的 effect，再重新执行它。

组件也是类似的。

一个 Vue 组件的模板最终会变成 render 函数，render 函数会被 Vue 包装成一个组件更新 effect。

所以模板里写：

```vue
<template>
  <div>{{ state.count }}</div>
</template>
```

可以粗略理解成：

```js
effect(() => {
  render(state.count)
})
```

这也是为什么修改响应式数据后，不是 Vue “全局扫一遍页面”，而是找到依赖这个数据的 effect，让它重新执行。

## activeEffect：track 怎么知道收集谁

接下来有一个问题：

`track(target, key)` 只拿到了 `target` 和 `key`，它怎么知道当前要收集哪个 effect？

答案是：运行 effect 之前，先把它放到一个全局变量里。

简化版代码是这样：

```js
let activeEffect

function effect(fn) {
  const effectFn = () => {
    activeEffect = effectFn
    fn()
    activeEffect = undefined
  }

  effectFn()
}

function track(target, key) {
  if (!activeEffect) return

  // 把 activeEffect 记录到 target/key 对应的依赖集合里
}
```

执行顺序是：

```txt
1. 调用 effect(fn)
2. 把当前 effect 赋值给 activeEffect
3. 执行 fn
4. fn 内部读取 state.count
5. 进入 Proxy get
6. get 调用 track(raw, 'count')
7. track 读取 activeEffect
8. 建立 raw.count -> activeEffect 的关系
9. fn 执行结束，清空 activeEffect
```

所以依赖收集并不是“创建 reactive 时”完成的。

依赖收集发生在：

```txt
effect 正在执行，并且 effect 内部读取了响应式属性的时候。
```

这也是很多误解的根源。

比如：

```js
const state = reactive({ count: 0 })
state.count = 1
```

这段代码会触发 `set`，但如果此前没有任何 effect 在执行期间读取过 `state.count`，那么依赖表里就没有记录。

所以触发更新时只能得到：

```txt
count 变了，但没有 effect 依赖它。
```

这不是响应式失效，而是从来没有建立过依赖关系。

## 依赖桶为什么是三层结构

最小响应式实现里经常会出现这样的结构：

```js
const bucket = new WeakMap()
```

它通常保存的是：

```txt
WeakMap<
  target,
  Map<
    key,
    Set<effect>
  >
>
```

看起来有点绕，但它解决的是三个维度的问题。

第一层：区分不同对象。

```js
const user = reactive({ name: 'Tom' })
const book = reactive({ name: 'Vue' })
```

`user.name` 和 `book.name` 的属性名都叫 `name`，但它们显然不是同一个依赖。

所以第一层要用原始对象 `target` 区分。

第二层：区分同一个对象上的不同属性。

```js
const state = reactive({
  count: 0,
  name: 'Vue',
})
```

如果 effectA 读取了 `state.count`：

```js
effect(() => {
  console.log(state.count)
}, 'effectA')
```

effectB 读取了 `state.name`：

```js
effect(() => {
  console.log(state.name)
}, 'effectB')
```

那么修改 `count` 时只应该触发 effectA。

修改 `name` 时只应该触发 effectB。

所以第二层要用 `key` 区分属性。

第三层：一个属性可能被多个 effect 依赖。

```js
effect(() => {
  console.log(state.count)
}, 'effectA')

effect(() => {
  console.log(state.count * 2)
}, 'effectC')
```

这两个 effect 都读了 `state.count`。

当 `state.count` 变化时，它们都应该重新执行。

所以第三层要用 `Set` 保存多个 effect。

最终关系就是：

```txt
bucket
  -> rawState
    -> count
      -> effectA
      -> effectC
    -> name
      -> effectB
```

这就是为什么实现里需要 `depsMap` 和 `deps`。

`depsMap` 表示：

```txt
某个对象身上的所有属性依赖表。
```

`deps` 表示：

```txt
某个属性自己的 effect 集合。
```

拆成这两层之后，响应式系统才能做到“属性级更新”，而不是对象里任意字段变化都把所有 effect 重跑一遍。

## track：读取时建立关系

`track` 的核心任务只有一个：

```txt
把当前 activeEffect 放进 target/key 对应的 Set 里。
```

简化版代码：

```js
function track(target, key) {
  if (!activeEffect) return

  let depsMap = bucket.get(target)
  if (!depsMap) {
    depsMap = new Map()
    bucket.set(target, depsMap)
  }

  let deps = depsMap.get(key)
  if (!deps) {
    deps = new Set()
    depsMap.set(key, deps)
  }

  deps.add(activeEffect)
}
```

这段代码可以按三个问题理解：

```txt
这个对象有没有依赖表？
这个属性有没有依赖集合？
当前 effect 有没有放进去？
```

所以 `track(state, 'count')` 的工作不是立即更新页面。

它只是登记一条关系：

```txt
以后 state.count 变了，请通知当前这个 effect。
```

## trigger：修改时反向查找

`trigger` 做的是反向查找。

读取时保存的是：

```txt
target -> key -> effects
```

修改时就沿着同样的路径找回去：

```js
function trigger(target, key) {
  const depsMap = bucket.get(target)
  const deps = depsMap?.get(key)

  if (!deps) return

  deps.forEach((effectFn) => {
    effectFn()
  })
}
```

比如修改：

```js
state.count++
```

响应式系统会查：

```txt
bucket.get(rawState).get('count')
```

如果里面有 effectA，就重新执行 effectA。

如果里面还有 effectC，就一起重新执行 effectC。

但如果修改：

```js
state.name = 'Vue 3'
```

它查的是：

```txt
bucket.get(rawState).get('name')
```

所以不会误触发只依赖 `count` 的 effect。

这就是响应式更新能做到局部精确的原因。

## 为什么要用 Reflect.get

在 Proxy 的 `get` 里，很多简化文章会直接写：

```js
return target[key]
```

这在普通对象上通常能工作，但不够完整。

更推荐写：

```js
return Reflect.get(target, key, receiver)
```

原因是 `Reflect.get` 更接近 JavaScript 原本的属性读取语义，尤其是遇到 getter 时，`this` 会更准确。

比如：

```js
const raw = {
  count: 1,
  get double() {
    return this.count * 2
  },
}
```

当你读取：

```js
state.double
```

如果用：

```js
target[key]
```

getter 里的 `this` 更容易指向原始对象。

这样 `this.count` 可能直接从原始对象读取，绕过代理对象，导致 `count` 的读取没有进入 Proxy `get`。

如果用：

```js
Reflect.get(target, key, receiver)
```

getter 里的 `this` 可以指向代理对象。

这样 `this.count` 会继续触发代理对象的 `get`，`count` 这个属性也能被正确追踪。

所以 `Reflect.get` 不是为了写法高级，而是为了让属性访问行为尽量符合语言本身的规则。

## 解构为什么容易断

现在再看解构就清楚了。

```js
const state = reactive({
  count: 0,
})

const { count } = state
```

这段解构大致等价于：

```js
const count = state.count
```

这一行确实读取了 `state.count`。

如果 `state` 是代理对象，也确实会进入 Proxy 的 `get`。

但问题有两个。

第一个问题：这次读取不一定发生在 effect 里面。

如果解构发生在普通初始化代码里，`activeEffect` 是空的。

这时即使进入了 `get`，`track` 也不会收集任何依赖。

第二个问题更关键：解构之后，后续代码读取的是普通变量。

```js
console.log(count)
```

这次读取不会进入 Proxy 的 `get`。

因为它不再是：

```js
state.count
```

而只是：

```js
count
```

普通局部变量的读取，JavaScript 没有提供拦截入口。

Vue 没有机会知道这个变量来自 `state.count`，也没有机会执行 `track(rawState, 'count')`。

所以更准确的说法不是“解构会让值消失响应式”，而是：

```txt
解构会把后续读取，从代理对象属性读取，变成普通变量读取。
```

断掉的是访问路径。

## 对象解构为什么更容易迷惑

基础类型比较直观：

```js
const state = reactive({ count: 0 })
const { count } = state

state.count++

console.log(count) // 0
console.log(state.count) // 1
```

`count` 是当时取出来的数字快照。

但对象类型会更绕一点。

```js
const state = reactive({
  user: {
    name: 'Tom',
  },
})

const { user } = state
```

如果后面写：

```js
effect(() => {
  console.log(user.name)
})

user.name = 'Jerry'
```

你可能会发现 effect 仍然能执行。

原因是 `reactive` 默认会对嵌套对象做懒代理。

读取 `state.user` 时，拿到的 `user` 可能已经是内层对象的代理。

所以 `user.name` 这条路径仍然经过了 Proxy。

但这并不代表对象解构完全安全。

看这个变化：

```js
state.user = {
  name: 'Alice',
}
```

如果 effect 里只读取了：

```js
user.name
```

那它依赖的是旧 `user` 对象的 `name`。

它没有读取：

```js
state.user
```

所以它不一定能感知外层 `state.user` 被整体替换。

如果写成：

```js
effect(() => {
  console.log(state.user.name)
})
```

依赖关系就更完整：

```txt
rawState.user -> 当前 effect
rawUser.name  -> 当前 effect
```

当 `state.user` 被替换时，effect 会重新执行。

重新执行时又会读取新对象的 `name`，于是依赖会切到新的对象上。

这就是对象解构最容易误导人的地方：

```txt
它可能没有完全断，但它丢掉了外层属性访问路径。
```

## 调试这份最小实现

同目录下的 `mini-reactivity-debug.js` 是一份刻意缩小过的响应式实现。

它只保留这些内容：

```txt
reactive()
effect()
track()
trigger()
Proxy get / set
WeakMap -> Map -> Set
```

你可以直接在调试器里看它的执行过程。

建议重点打断点的位置：

```txt
1. reactive() 里的 get
2. track()
3. reactive() 里的 set
4. trigger()
5. effect()
```

打开同目录下的 Vue 示例后，点击按钮时观察控制台：

```txt
修改 state.num
  -> 只触发读取过 num 的 effect

修改 name
  -> 只触发读取过 name 的 effect
```

这样可以直观看到：

```txt
不是对象任意属性变化都会触发所有更新。
而是谁读取过哪个 key，哪个 key 变化时才通知谁。
```

## 小结

`reactive` 的原理可以压缩成一句话：

```txt
用 Proxy 拦截对象属性访问，在 get 中收集依赖，在 set 中触发依赖。
```

真正需要反复咀嚼的是这几个点：

```txt
依赖不是创建 reactive 时收集的，而是 effect 执行期间读取属性时收集的。
Vue 追踪的不是变量名，而是 target + key 这样的属性访问关系。
WeakMap -> Map -> Set 是为了同时区分对象、属性和多个 effect。
解构容易断，是因为后续读取不再经过代理对象的 get。
```

所以学习响应式原理时，不要只盯着“数据变了页面更新”这个结果。

更应该盯住这条链路：

```txt
谁读取了？
读取的是哪个对象的哪个属性？
读取时有没有 activeEffect？
修改时能不能沿着同一个 target/key 找回对应的 effect？
```

只要这条链路是通的，响应式就能工作。

只要这条链路断了，数据本身再怎么变化，Vue 也不知道应该通知谁。
