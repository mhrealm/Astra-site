---
title: 'Vue 模板编译原理：template 是怎么变成 render 函数的？'
description: '从 parse、AST、transform、generate 到 VNode，用一个 mini compiler 看懂 Vue 模板编译的主线。'
pubDate: '2026-09-04'
category: 'Vue'
categorySlug: 'vue'
tags: ['Vue3', '模板编译', 'render', 'VNode']
difficulty: 4
---

我们平时写 Vue，最熟悉的是模板：

```vue
<template>
  <div class="cart">总价：{{ price * quantity }}</div>
</template>
```

但浏览器不会执行 Vue 模板。

Vue 真正运行时执行的是 `render` 函数。模板编译做的事情，就是把声明式模板转换成可以执行的 JavaScript 渲染函数。

可以把主线理解成：

```txt
template 字符串
-> parse 成 AST
-> transform 分析动态部分
-> generate 生成 render 函数代码
-> render 执行后生成 VNode
-> patch / diff 更新真实 DOM
```

如果你想直接调试，可以看同目录下的 `mini-compiler.js`。

直接运行：

```bash
node src/blog/vue/template-compiler/mini-compiler.js
```

它不会复刻 Vue 的完整编译器，只保留一条最小链路：

```txt
compile(template)
-> parse(template)
-> transform(ast)
-> generate(ast)
-> new Function(...) 得到 render
-> render(ctx) 得到 VNode
```

## 为什么需要编译

模板的优点是直观：

```vue
<div class="cart" :data-count="quantity">总价：{{ price * quantity }}</div>
```

但这段代码不能被 JavaScript 直接执行。

Vue 需要把它变成类似这样的 render 函数：

```js
function render(_ctx) {
  return h(
    'div',
    {
      class: 'cart',
      'data-count': _ctx.quantity,
    },
    ['总价：', String(_ctx.price * _ctx.quantity)],
  )
}
```

也就是说，模板编译的第一层意义是：

```txt
把模板这种声明式描述，转换成 JavaScript 函数调用。
```

但它不只是翻译。

更重要的是，Vue 可以在编译阶段提前分析：

```txt
哪些内容是静态的？
哪些内容是动态的？
哪些 props 会变？
哪些 children 会变？
```

这些分析结果会变成运行时优化信息，比如 `patchFlag`。

## parse：把字符串变成 AST

模板一开始只是字符串：

```html
<div class="cart" :data-count="quantity">总价：{{ price * quantity }}</div>
```

`parse` 做的事情是识别这段字符串的结构。

它会把模板转成类似这样的 AST：

```txt
Root
└── Element: div
    ├── props
    │   ├── class="cart"
    │   └── :data-count="quantity"
    └── children
        ├── Text: 总价：
        └── Interpolation: price * quantity
```

AST 的价值是：让后面的编译步骤不再面对混乱的字符串，而是面对结构化节点。

比如在 `mini-compiler.js` 里，节点类型被简化成四种：

```js
const NodeTypes = {
  ROOT: 'Root',
  ELEMENT: 'Element',
  TEXT: 'Text',
  INTERPOLATION: 'Interpolation',
}
```

这已经足够表达一个最小模板：

```txt
根节点
元素节点
文本节点
插值节点
```

## transform：分析动态部分

有了 AST 之后，下一步不是立刻生成代码，而是先分析。

比如这个模板：

```html
<div class="cart" :data-count="quantity">总价：{{ price * quantity }}</div>
```

里面有两类动态内容：

```txt
:data-count="quantity" 是动态 prop
{{ price * quantity }} 是动态文本
```

所以 mini compiler 会给这个 `div` 打上两个标记：

```js
const PatchFlags = {
  TEXT: 1,
  PROPS: 8,
}
```

最终：

```txt
patchFlag = TEXT | PROPS
patchFlag = 1 | 8
patchFlag = 9
```

这个 `9` 的含义是：

```txt
这个节点既有动态文本，也有动态 props。
```

真实 Vue 的 `patchFlag` 更丰富，比如 class、style、事件、动态插槽等都会有对应标记。

但核心思想一样：

```txt
编译阶段多分析一点，运行阶段就少猜一点。
```

## generate：生成 render 代码

`generate` 会把 AST 转成 JavaScript 代码字符串。

mini compiler 生成的代码类似：

```js
return function render(_ctx) {
  return h(
    'div',
    { class: 'cart', 'data-count': evaluate(_ctx, 'quantity') },
    ['总价：', toDisplayString(evaluate(_ctx, 'price * quantity'))],
    9,
  )
}
```

这里有几个点：

`h` 用来创建 VNode。

`_ctx` 表示渲染上下文。可以粗略理解成组件实例上暴露给模板访问的数据。

`evaluate(_ctx, 'quantity')` 是这个 mini compiler 为了演示动态表达式做的简化处理。

真实 Vue 编译器不会这样粗暴地用 `new Function + with` 去跑任意表达式；这里是为了让代码更短、更容易调试。

## render：生成 VNode

编译后的 render 函数执行时，会返回 VNode。

比如：

```js
const { render } = compile(template)

const vnode = render({
  price: 10,
  quantity: 2,
})
```

得到的结果类似：

```js
{
  type: 'div',
  props: {
    class: 'cart',
    'data-count': 2
  },
  children: ['总价：', '20'],
  patchFlag: 9
}
```

VNode 不是真实 DOM。

它只是对 UI 的一份 JavaScript 描述：

```txt
我要渲染一个 div。
它有哪些 props。
它有哪些 children。
它有哪些动态部分。
```

后续真正更新页面时，Vue runtime 会拿新旧 VNode 做 patch。

## 编译和响应式的关系

响应式解决的是：

```txt
数据变了，谁需要重新执行？
```

模板编译解决的是：

```txt
模板应该怎样变成可执行的 render 函数？
```

二者会在组件更新时接上：

```txt
响应式数据变化
-> trigger 组件的 render effect
-> render 函数重新执行
-> 生成新的 VNode
-> patch 新旧 VNode
-> 更新真实 DOM
```

所以模板编译不是响应式的一部分，但它决定了组件渲染时会读取哪些响应式数据，也决定了运行时更新 DOM 时可以有多精准。

## 小结

Vue 模板编译可以先抓住这四步：

```txt
parse：把模板字符串变成 AST。
transform：分析 AST，标记动态部分。
generate：把 AST 生成 render 函数代码。
render：执行 render，得到 VNode。
```

如果说响应式系统解决的是“数据变化后谁重新执行”，那么模板编译解决的是“重新执行的 render 函数从哪里来”。

这也是 Vue 的一个重要设计取舍：

```txt
模板给开发者更好的书写体验。
编译器把这份体验转换成运行时更容易执行和优化的代码。
```
