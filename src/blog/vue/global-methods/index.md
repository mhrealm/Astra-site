---
title: '如何定义全局的方法？'
description: '演示全局方法、注入方法和组件内 fallback 的调用方式。'
pubDate: '2021-05-10'
category: 'Vue 基础'
categorySlug: 'vue'
tags: ['基础交互']
difficulty: 1
source: 'vue-practice/src/views/vue/global-methods/index.vue'
---

> **临时说明**：本文由 AI 根据当前 `index.vue` 整理，已经补充插件、依赖注入和 TypeScript 类型声明，但仍不是最终发布版本。

## “全局方法”到底应该全局到什么程度

消息提示、埋点、权限判断和格式化函数经常被称为全局能力。把它们全部挂到组件实例上虽然调用方便，却会隐藏依赖：只看组件 import，无法知道它依赖 `$showToast`。

Vue 3 中常见的共享方式有四种：

1. 普通模块导入。
2. composable。
3. `provide/inject`。
4. `app.config.globalProperties`。

没有一种适合所有场景。选择标准应是依赖是否需要替换、是否依赖组件树、是否需要访问响应式状态，以及是否真的值得在每个组件实例上暴露。

## 当前示例做了什么

组件先尝试从实例代理读取 `$showToast`：

```ts
const instance = getCurrentInstance()
const proxy = instance?.proxy

if (proxy?.$showToast) {
  proxy.$showToast(message)
  return
}
```

如果宿主应用没有注册该方法，就退回到组件内部的 `toastMessage`，保证独立演示仍然可运行。

另一个方法通过 inject 获取：

```ts
const sayHello = inject('$sayHello', (name) => {
  window.alert(`hello：${name}`)
})
```

第二个参数是默认实现。上层没有 provide 时不会得到 undefined，但默认实现是否合理要根据业务决定；权限、支付等关键依赖更适合缺失时直接报错，而不是悄悄降级。

## globalProperties 如何注册

最直接的注册方式是：

```ts
const app = createApp(App)

app.config.globalProperties.$showToast = (message: string) => {
  // 显示全局提示
}
```

Options API 中可以通过 `this.$showToast()` 使用。`<script setup>` 没有组件 this，所以示例通过 `getCurrentInstance().proxy` 访问。

`getCurrentInstance` 更接近框架内部逃生口，不适合作为业务组件的默认依赖获取方式。它只能在 setup 执行期间拿到当前实例，类型也不如显式函数清晰。

## 把注册封装成插件

需要初始化、配置或复用时，可以创建 Vue 插件：

```ts
interface ToastOptions {
  duration: number
}

export const toastPlugin = {
  install(app: App, options: ToastOptions) {
    app.config.globalProperties.$showToast = (message: string) => {
      showToast(message, options)
    }
  },
}
```

入口统一注册：

```ts
app.use(toastPlugin, { duration: 2500 })
```

插件适合安装级能力，但不要在 install 中随意创建无法清理的全局事件和单例 DOM。SSR 下每个请求都可能创建新的 app，状态应绑定到当前 app，而不是放在跨请求共享的模块变量里。

## TypeScript 为什么会不认识 $showToast

运行时挂载属性后，TypeScript 的组件类型并不会自动增加成员。需要扩展 Vue 的 `ComponentCustomProperties`：

```ts
// src/types/vue.d.ts
import 'vue'

declare module 'vue' {
  interface ComponentCustomProperties {
    $showToast: (message: string) => void
  }
}

export {}
```

这个声明只告诉类型系统属性存在，不会完成运行时注册。反过来，只注册不声明，代码能运行但编辑器会报类型错误。两部分必须同时存在。

## provide/inject 更适合可替换依赖

`provide/inject` 沿组件树传递依赖，子树可以覆盖上层实现，测试时也容易注入替身。TypeScript 项目建议使用 `InjectionKey`：

```ts
import type { InjectionKey } from 'vue'

type SayHello = (name: string) => void

export const sayHelloKey: InjectionKey<SayHello> = Symbol('sayHello')
```

提供方：

```ts
provide(sayHelloKey, (name) => {
  console.log(`hello: ${name}`)
})
```

消费方：

```ts
const sayHello = inject(sayHelloKey)

if (!sayHello) {
  throw new Error('sayHello provider is missing')
}
```

Symbol 可以避免字符串 key 冲突，`InjectionKey` 会把函数类型同时传给 provide 和 inject。

## 普通 import 往往已经够用

如果方法无状态、无需按组件树替换，直接导入最清楚：

```ts
import { formatDate } from '@/utils/date'
```

如果能力包含响应式状态和生命周期，可以封装 composable：

```ts
const { showToast, currentToast } = useToast()
```

显式 import 让依赖一眼可见，也更容易 tree-shaking、单元测试和代码搜索。不要为了少写一行 import，就把几十个工具函数都塞进 globalProperties。

## 选择建议

- 纯函数和业务服务：优先普通 import。
- 组合响应式状态：使用 composable。
- 子树可覆盖、主题或上下文依赖：使用 provide/inject。
- 与 Vue 应用安装过程绑定、模板和 Options API 高频使用：考虑插件与 globalProperties。

无论选择哪一种，都应保持名称、类型和错误策略统一。以 `$` 开头通常表示组件实例全局属性，不建议给普通局部函数也加 `$`。

## 小结

全局方法的真正成本是隐式依赖。`globalProperties` 提供调用便利，`provide/inject` 提供上下文和可替换性，composable 与普通 import 则保持依赖显式。先判断能力的生命周期和作用域，再决定注入方式，比单纯追求“任何组件都能直接调用”更重要。
