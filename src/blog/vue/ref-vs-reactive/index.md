---
title: 'Vue 3 发布快 6 年了，你还在疑惑：既生 ref，何生 reactive？'
description: '从 Proxy、track、trigger、activeEffect 和 JavaScript 变量语义出发，讲清楚 reactive 解构为什么会断，ref 为什么更适合跨边界传递，以及 Vue 3 为什么同时需要 ref 和 reactive。'
pubDate: '2026-09-03'
category: 'Vue'
categorySlug: 'vue'
tags: ['Vue3', '响应式', 'ref', 'reactive']
difficulty: 4
demoSlug: 'vue-ref-vs-reactive'
demoTitle: 'mini reactive 调试入口'
demoDescription: '在 Vue 组件中引入手写 reactive，对比 state.count 和解构 count 的更新差异。'
---

Vue 3.0 正式版发布于 [2020 年 9 月 18 日](https://blog.vuejs.org/posts/vue-3-one-piece)，到现在已经快 6 年了。

但只要写 Composition API，这个问题仍然绕不开：

```js
const count = ref(0)
const state = reactive({ count: 0 })
```

既然 `ref` 可以做响应式，为什么还要有 `reactive`？

既然 `reactive` 写起来更像普通对象，为什么很多组合式函数又更喜欢返回 `ref`？

这个问题看起来是 API 选择，本质上其实是 Vue 3 响应式系统和 JavaScript 语言语义共同塑造出来的设计结果。

## 先说结论

`ref` 和 `reactive` 不是重复设计。

它们解决的是两类不同的问题：

```txt
ref      解决的是：如何让一个值拥有稳定的响应式身份。
reactive 解决的是：如何让一个对象图具备属性级响应式能力。
```

更具体一点：

```txt
reactive 的依赖建立在 Proxy 的属性访问上。
ref 的依赖建立在 .value 这个访问器上。
```

所以 `reactive` 容易在解构、传参、返回值时丢失响应式连接；而 `ref` 只要保留 ref 对象本身，就更容易跨函数、跨模块、跨解构传递。

这不是 Vue 的语法偏好，而是 JavaScript 决定的。

## Vue 追踪的不是变量

很多人理解响应式时，会下意识以为 Vue 在追踪变量：

```js
const state = reactive({ count: 0 })
const count = state.count
```

于是会觉得：

```js
state.count++
```

之后，`count` 也应该跟着变。

但 Vue 做不到这一点，因为 JavaScript 没有提供拦截普通局部变量读取和赋值的能力。

Vue 能拦截的是这些动作：

```js
state.count
countRef.value
```

它不能拦截这个动作：

```js
count
```

这就是理解 `reactive` 解构断联的第一层基础。

响应式不是建立在变量名上，而是建立在“读取了哪个响应式对象的哪个属性”上。

Vue 内部的依赖表可以粗略理解成这样：

```js
WeakMap {
  rawState => Map {
    'count' => Set([
      renderEffect,
      computedEffect,
      watchEffect
    ])
  }
}
```

它记录的是：

```txt
target 对象 + key 属性 -> 哪些 effect 依赖它
```

不是：

```txt
count 这个变量 -> 哪些地方用过它
```

变量名只是 JavaScript 代码里的词法绑定。运行时的 Vue 响应式系统看不见它，也追踪不了它。

如果你想直接调试，可以看同目录下的 `mini-reactivity-debug.js`。它不是直接调用 Vue 的 `reactive`，而是手写了 reactive 的最小实现，只保留 Proxy `get/set`、`track`、`trigger` 和 `effect`。调试时重点观察三件事：

- 读取 `state.count` 时，会不会进入 Proxy 的 `get`。
- 进入 `get` 时，当前有没有 `activeEffect`。
- 如果没有 `activeEffect`，这次读取就只能拿到值，不能把任何 effect 登记到依赖表里。

## reactive 的核心是 Proxy

`reactive` 返回的是一个 Proxy。

简化一下，可以把它想象成：

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

真实实现当然更复杂，要处理只读、浅层响应式、数组、Map、Set、ref 解包、原始对象缓存等很多细节。

但核心思路就是：

```txt
读属性时 track。
写属性时 trigger。
```

比如组件渲染时读到了：

```js
state.count
```

就会触发 Proxy 的 `get`，Vue 于是知道：

```txt
当前组件的 render effect 依赖 state 的 count 属性。
```

之后如果执行：

```js
state.count++
```

会触发 Proxy 的 `set`，Vue 就能找到之前收集过的 render effect，让组件重新渲染。

关键点在这里：

```txt
依赖收集必须发生在 effect 正在执行期间。
```

这里的 effect 可以是组件 render、`computed`、`watchEffect` 等。

可以粗略理解为：

```js
let activeEffect

function effect(fn) {
  activeEffect = fn
  fn()
  activeEffect = undefined
}

function track(target, key) {
  if (!activeEffect) return
  // 把 activeEffect 记录到 target/key 对应的依赖集合里
}
```

只有当某个响应式属性在 effect 执行期间被读取，Vue 才知道“谁依赖了它”。

## reactive 解构为什么会断

看这段代码：

```js
const state = reactive({
  count: 0,
})

const { count } = state
```

它等价于：

```js
const count = state.count
```

这一刻确实发生了 `state.count` 的读取，也确实触发了 Proxy 的 `get`。

但问题是：这次读取通常发生在 `setup()` 顶层初始化阶段，而不是组件 render effect、`computed` effect 或 `watchEffect` 正在执行期间。

换句话说，可能发生了 `get`，但没有可记录的 `activeEffect`。

更重要的是，解构完成后，后续代码里用的已经不是：

```js
state.count
```

而是：

```js
count
```

`count` 是一个普通局部变量。模板、计算属性、监听器再读取它时，不会再次触发 Proxy 的 `get`，也就不会再次执行：

```js
track(rawState, 'count')
```

这就是断联的真正原因。

不是“Vue 不喜欢解构”，而是：

```txt
解构把一次响应式属性访问，提前变成了一份普通值快照。
后续读取这个快照时，已经绕开了 Proxy。
```

所以这段代码不会按预期更新：

```js
const state = reactive({ count: 0 })
const { count } = state

watchEffect(() => {
  console.log(count)
})

state.count++
```

`watchEffect` 执行时读取的是普通变量 `count`，不是 `state.count`。

它没有触发 Proxy 的 `get`，Vue 就不知道这个 `watchEffect` 和 `state.count` 有关系。

如果改成这样：

```js
watchEffect(() => {
  console.log(state.count)
})
```

就能正常更新。

因为 effect 执行期间读取了 `state.count`，依赖被收集到了：

```txt
rawState.count -> watchEffect
```

## 断掉的不是值，而是访问路径

这个点很关键。

很多人说“解构会丢失响应式”，这句话没错，但还不够精确。

更精确的说法是：

```txt
解构丢掉的是后续读取时经过响应式代理的访问路径。
```

对于基础类型，这个问题最明显：

```js
const state = reactive({ count: 0 })
const { count } = state

state.count++

console.log(count) // 0
console.log(state.count) // 1
```

`count` 只是当时取出来的数字。数字没有引用身份，也没有 getter、setter，更不可能通知 Vue。

但对象会更迷惑。

```js
const state = reactive({
  user: {
    name: 'Tom',
  },
})

const { user } = state
```

你可能会发现：

```js
user.name = 'Jerry'
```

页面居然还是会更新。

这是因为 `reactive` 默认会深层转换对象。读取 `state.user` 时，拿到的 `user` 可能已经是一个嵌套的 reactive proxy。

所以 `user.name` 仍然是一次响应式属性访问。

但这不代表解构完全安全。它丢掉的是 `state.user` 这一层访问路径。

比如：

```js
const state = reactive({
  user: {
    name: 'Tom',
  },
})

const { user } = state

watchEffect(() => {
  console.log(user.name)
})

state.user = {
  name: 'Alice',
}
```

这个 `watchEffect` 追踪的是：

```txt
旧 user 对象的 name 属性
```

而不是：

```txt
state 对象的 user 属性
```

因为 effect 内部没有读取：

```js
state.user
```

它只读取了：

```js
user.name
```

所以当你整体替换 `state.user` 时，它可能不会按你预期重新指向新对象。

如果写成：

```js
watchEffect(() => {
  console.log(state.user.name)
})
```

依赖会更接近你的真实意图：

```txt
state.user
user.name
```

这样替换 `state.user` 时，effect 也能重新执行，并在下一轮执行中追踪新对象的 `name`。

这就是 `reactive` 解构最容易误导人的地方：

```txt
基础类型解构后通常直接变成快照。
对象类型解构后可能仍然能响应内部属性变化，但会丢掉父对象属性这一层连接。
```

所以它不是简单的“断”或“不断”，而是要看你后续还保留了哪一层响应式访问路径。

## ref 的本质是响应式 cell

`ref` 的设计和 `reactive` 不一样。

它不是试图让普通变量本身变成响应式，而是创建一个稳定的响应式容器。

```js
const count = ref(0)
```

可以粗略理解成：

```js
function ref(value) {
  const wrapper = {
    get value() {
      track(wrapper, 'value')
      return value
    },
    set value(nextValue) {
      value = nextValue
      trigger(wrapper, 'value')
    },
  }

  return wrapper
}
```

也就是说，`ref` 的响应式入口不是变量名 `count`，而是：

```js
count.value
```

当你读取 `count.value` 时，Vue 可以执行 `track`。

当你修改 `count.value` 时，Vue 可以执行 `trigger`。

真正重要的是：`count` 这个变量保存的是 ref 容器对象的引用。

所以当你这样写：

```js
const count = ref(0)
const anotherCount = count
```

你复制的不是 `0`，而是同一个响应式容器。

之后无论在哪个函数里，只要读取：

```js
anotherCount.value
```

都仍然会进入 getter，依赖就还能被收集。

这就是 `ref` 比 `reactive` 的单个属性更适合跨边界传递的原因。

```txt
reactive 的响应式藏在对象的属性访问里。
ref 把一个值包装成了可以到处传递的响应式单元。
```

## 为什么 ref 解构不容易断

组合式函数里经常会这样写：

```js
function useMouse() {
  const x = ref(0)
  const y = ref(0)

  return {
    x,
    y,
  }
}

const { x, y } = useMouse()
```

这里的解构通常是安全的。

原因不是“解构 ref 有特殊魔法”，而是因为你解构出来的是 ref 对象本身。

也就是说，`x` 不是数字：

```js
0
```

而是这个响应式容器：

```js
RefImpl {
  value: 0
}
```

后续模板里写：

```vue
{{ x }}
```

模板会自动解包，大致相当于读取：

```js
x.value
```

后续 JS 里写：

```js
console.log(x.value)
```

也会进入 ref 的 getter。

所以依赖仍然能建立在：

```txt
xRef.value -> renderEffect
```

但是，`ref` 不是永远不会断。

如果你这样写：

```js
const x = ref(0)
const n = x.value
```

那 `n` 就只是一个普通数字。

后续读取：

```js
console.log(n)
```

也不会触发任何 getter。

所以更准确的说法是：

```txt
ref 不是不会断。
而是只要你保留 ref 容器本身，它就不容易在解构、返回值和传参时断。
```

## toRef 修复的到底是什么

既然 `reactive` 解构容易丢访问路径，那为什么 `toRef` 可以修复？

看这个例子：

```js
const state = reactive({
  count: 0,
})

const count = toRef(state, 'count')
```

`toRef(state, 'count')` 不是把 `state.count` 当前的值复制一份。

它创建的是一个指向 `state.count` 的属性引用。

可以粗略理解成：

```js
const count = {
  get value() {
    return state.count
  },
  set value(value) {
    state.count = value
  },
}
```

关键点是：

```txt
每次读取 count.value，都会重新读取 state.count。
```

所以 effect 里读：

```js
count.value
```

最终还是会经过：

```js
state.count
```

于是 Proxy 的 `get` 仍然会被触发，依赖链就接回来了。

这三种写法完全不同：

```js
const a = state.count
const b = toRef(state, 'count')
const c = computed(() => state.count)
```

可以这样理解：

```txt
a：一次性的值快照。
b：可读可写的属性引用。
c：只读的派生响应式值。
```

所以：

```js
state.count++
```

之后：

```txt
a 不会变。
b.value 会变。
c.value 会变。
```

Vue 官方文档里也特别强调过：`toRef()` 基于响应式对象属性创建的 ref 会和源属性保持同步；而 `ref(state.foo)` 接收到的是当时的纯值，不会和源属性同步。

这句话背后其实就是“访问路径”问题。

## 为什么不能只有 reactive

如果只有 `reactive`，第一个问题马上出现：

```js
reactive(1)
reactive('hello')
reactive(false)
```

这些都不适合作为响应式对象。

因为 `Proxy` 只能代理对象，不能代理数字、字符串、布尔值这些基础类型。

但前端状态里，大量状态恰恰是基础类型：

```js
const loading = ref(false)
const keyword = ref('')
const page = ref(1)
const visible = ref(false)
const selectedId = ref(null)
```

如果没有 `ref`，Vue 就很难自然表达一个独立基础值的响应式状态。

第二个问题是组合式函数。

Composition API 鼓励你把逻辑拆成函数：

```js
function useRequest() {
  const loading = ref(false)
  const data = ref(null)
  const error = ref(null)

  return {
    loading,
    data,
    error,
  }
}
```

调用方自然会解构：

```js
const { loading, data, error } = useRequest()
```

如果返回的是 ref，解构出来的仍然是响应式容器。

但如果只靠 `reactive`：

```js
function useRequest() {
  const state = reactive({
    loading: false,
    data: null,
    error: null,
  })

  return state
}

const { loading, data, error } = useRequest()
```

调用方一解构，就容易把响应式属性变成普通快照。

这和 Composition API 的函数组合思想是冲突的。

所以 `ref` 的存在不是为了替代 `reactive`，而是为了补上 JavaScript 里“普通变量不可被拦截”和“基础类型不能被 Proxy”这两个限制。

## 为什么不能只有 ref

那反过来，为什么不能所有状态都用 `ref`？

当然可以，很多项目也确实倾向于多用 `ref`。

但如果只有 `ref`，结构化对象状态会变得啰嗦。

比如一个表单：

```js
const username = ref('')
const password = ref('')
const remember = ref(false)
const nickname = ref('')
const avatar = ref('')
```

字段少的时候没问题。

字段多了以后，这些状态开始散落在同一个作用域里，业务结构不明显。

使用 `reactive`，它可以保持对象模型：

```js
const form = reactive({
  account: {
    username: '',
    password: '',
  },
  profile: {
    nickname: '',
    avatar: '',
  },
  remember: false,
})
```

这段代码表达的是一个完整的状态对象，而不是一堆彼此并列的变量。

在业务上，它更像：

```txt
form 是一个整体。
account 是 form 的一部分。
profile 是 form 的一部分。
remember 是 form 的一部分。
```

如果改成一个对象 ref：

```js
const form = ref({
  account: {
    username: '',
    password: '',
  },
  profile: {
    nickname: '',
    avatar: '',
  },
  remember: false,
})
```

在脚本里就会不断出现：

```js
form.value.account.username
form.value.profile.nickname
form.value.remember
```

当然，这不是不能写，只是对复杂对象来说不够自然。

`reactive` 的价值就在于：

```txt
让对象状态保持对象的写法。
```

它牺牲了一部分跨边界解构的稳定性，换来了对象模型内部更自然的属性访问。

## ref 和 reactive 不是同一层抽象

把它们放在同一层比较，容易误解。

`reactive` 更像是：

```txt
object graph reactivity
```

它让一整棵对象图具备属性级追踪能力：

```js
state.user.name
state.list.length
state.options.theme
```

`ref` 更像是：

```txt
reactive cell
```

它给一个值创建了一个稳定的位置：

```js
count.value
user.value
list.value
```

这两者的差异可以用一句话概括：

```txt
reactive 响应的是对象上的属性。
ref 响应的是容器里的值。
```

对象属性适合描述结构。

值容器适合描述边界。

所谓边界，包括：

- 从组合式函数返回。
- 传给另一个函数。
- 暴露给另一个模块。
- 作为单个状态独立替换。
- 被模板自动解包使用。

所以 `ref` 在组合逻辑里特别强，`reactive` 在聚合状态里特别顺。

## 用一个例子看设计取舍

假设你写一个搜索列表页。

这些状态适合用 `ref`：

```js
const keyword = ref('')
const loading = ref(false)
const page = ref(1)
const list = ref([])
```

因为它们都是独立值，而且经常需要整体替换：

```js
list.value = await fetchList()
page.value++
loading.value = true
```

而筛选条件可能适合用 `reactive`：

```js
const filters = reactive({
  status: '',
  dateRange: [],
  onlyMine: false,
})
```

因为它是一组天然聚合的条件。

如果你要把它们返回给调用方，可以这样：

```js
function useSearch() {
  const keyword = ref('')
  const loading = ref(false)
  const list = ref([])

  const filters = reactive({
    status: '',
    dateRange: [],
    onlyMine: false,
  })

  return {
    keyword,
    loading,
    list,
    filters,
  }
}
```

调用方可以安全解构 `keyword`、`loading`、`list`，因为它们是 ref。

但对 `filters`，更推荐保留对象访问：

```js
const { keyword, loading, list, filters } = useSearch()

filters.status = 'paid'
```

如果非要解构 `filters`，就用：

```js
const { status, dateRange, onlyMine } = toRefs(filters)
```

这样解构出来的是 ref，而不是普通快照。

## 一个容易忽略的特殊情况：props 解构

在普通 JavaScript 语义里，解构响应式对象会丢访问路径。

但是 Vue 对 `<script setup>` 里的 `defineProps()` 解构做过编译层面的特殊处理。

也就是说，这种写法在新版本 Vue 中可能不会按普通 `reactive` 对象解构那样断：

```js
const { foo } = defineProps(['foo'])
```

原因不是 JavaScript 变了，也不是 Proxy 能拦截局部变量了，而是编译器把某些访问改写成了对 `props.foo` 的访问。

这个点要分清楚：

```txt
props 解构的响应式保持，是编译器特殊处理。
普通 reactive 对象解构，不会自动拥有这种能力。
```

所以不要把 `defineProps` 的体验泛化到所有 `reactive` 对象上。

## 实战建议

我的实践倾向是：

```txt
基础类型优先用 ref。
需要整体替换的数据优先用 ref。
组合式函数返回值优先用 ref 或 toRefs。
结构化对象状态可以用 reactive。
不要随手解构 reactive。
需要解构 reactive 时，用 toRef 或 toRefs。
```

更具体一点：

```js
// 适合 ref
const loading = ref(false)
const count = ref(0)
const keyword = ref('')
const currentUser = ref(null)
const tableData = ref([])
```

```js
// 适合 reactive
const form = reactive({
  username: '',
  password: '',
  remember: false,
})
```

```js
// 不推荐
const { username, password } = form
```

```js
// 推荐
const { username, password } = toRefs(form)
```

还有一个判断标准：

```txt
如果你关心的是“这个值本身会被替换”，用 ref。
如果你关心的是“这个对象内部属性会被修改”，用 reactive。
```

例如：

```js
const user = ref(null)

user.value = await fetchUser()
user.value = null
```

这里 `user` 适合 `ref`，因为它经常整体替换。

而：

```js
const form = reactive({
  name: '',
  email: '',
})

form.name = 'Tom'
form.email = 'tom@example.com'
```

这里 `form` 适合 `reactive`，因为它更像一个稳定对象，内部属性在变化。

## 小结

`reactive` 解构后容易断，不是因为 Vue 有什么玄学规则，而是因为它的依赖收集依赖 Proxy 的属性访问。

解构会把：

```js
state.count
```

提前执行成：

```js
const count = 0
```

后续读取 `count` 时，已经不再经过 Proxy，Vue 就无法在 render、computed、watchEffect 中收集依赖。

`ref` 不容易断，也不是因为它更神奇，而是因为它把值放进了一个稳定的响应式 cell。只要你传递的是 ref 对象本身，后续读取 `.value` 仍然会进入 getter，依赖就还能被追踪。

所以“既生 ref，何生 reactive”的答案不是谁替代谁，而是：

```txt
ref 解决值的响应式身份。
reactive 解决对象的响应式结构。
```

Vue 3 同时需要它们，是因为 JavaScript 本身同时存在基础类型、对象引用、解构、函数返回和局部变量不可拦截这些语义。

当你理解这一层之后，`ref` 和 `reactive` 就不再是两个让人纠结的 API，而是两种状态建模工具：

```txt
一个负责让值稳定地流动。
一个负责让对象自然地表达结构。
```
