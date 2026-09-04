# 封装一个 mini reactive

```js
function reactive(raw) {
  if (!isObject(raw)) {
    return raw
  }
  const cachedProxy = reactiveCache.get(raw)
  if (cachedProxy) {
    return cachedProxy
  }
  const proxy = new Proxy(raw, {
    get(target, key, receiver) {
      track(target, key)
      const value = Reflect.get(target, key, receiver)
      return isObject(value) ? reactive(value) : value
    },
    set(target, key, value, receiver) {
      const oldValue = target[key]
      const result = Reflect.set(target, key, value, receiver)
      if (!Object.is(oldValue, value)) {
        trigger(target, key)
      }
      return result
    },
  })
  reactiveCache.set(raw, proxy)
  return proxy
}
```

## 读取 state.count 的时候 reactive 中 做了哪些事情？

```vue
<script setup>
const state = reactive({ count: 0 })
state.count
</script>
```

例如上面的代码，当读取 state.count 时，会触发 get，get主要做三件事。

1. 收集依赖

```js
track(target, key)
```

关于依赖的收集会在track函数中进行详细的解释，这里只需要知道依赖收集是在 get中进行的。

2. 读取真实值

```js
const value = Reflect.get(target, key, receiver)
```

不用 `target[key]`，是为了更准确地保留 getter、原型链、this 等语义。更加详细的解释会在答疑中介绍。

3. 如果值还是对象，继续转成 reactive

```js
return isObject(value) ? reactive(value) : value
```

如果读到的是普通值，比如数字、字符串，就直接返回。如果读到的是对象，就继续包一层 reactive。

这里一句话总结get的作用： **属性被读取时，先收集依赖，再拿到真实值；如果真实值是对象，就继续代理，保证深层对象也能响应式**。

## 常见疑问

1. 在get中返回值为什么要用`Reflect.get(target, key, receiver)`而不是用`target[key]`？
