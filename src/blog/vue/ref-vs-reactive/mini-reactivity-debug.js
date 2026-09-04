/**
 * 一个只用于理解 reactive 的最小响应式实现。
 *
 * 这份代码刻意不实现 ref / computed / watch / scheduler / cleanup 等能力，
 * 只保留 reactive 最核心的链路：
 *
 * 1. reactive() 用 Proxy 包装原始对象。
 * 2. 读取代理对象属性时，触发 get。
 * 3. get 内部调用 track()，把“当前正在运行的 effect”和“被读取的属性”建立关系。
 * 4. 修改代理对象属性时，触发 set。
 * 5. set 内部调用 trigger()，找到依赖这个属性的 effect 并重新执行。
 *
 * 直接运行：
 * node src/blog/vue/ref-vs-reactive/mini-reactivity-debug.js
 *
 * 建议断点顺序：
 * 1. reactive() 里的 get
 * 2. track()
 * 3. reactive() 里的 set
 * 4. trigger()
 * 5. effect()
 */

// activeEffect 表示“当前正在执行的副作用函数”。
//
// 可以把 effect 理解成一次组件渲染、一次 watchEffect，或者任何需要在数据变化后
// 重新执行的函数。只有 effect 正在运行时，读取 reactive 属性才有收集依赖的意义。
let activeEffect

// bucket 是整套响应式系统的依赖桶。
// 它的结构是：
// WeakMap<
//   rawTarget,
//   Map<
//     key,
//     Set<effectFn>
//   >
// >
//
// 翻译成人话就是：
// - 第一层：某个原始对象。
// - 第二层：这个对象上的某个属性。
// - 第三层：哪些 effect 读取过这个属性。
//
// 例如 effect 内部读了 state.count，最后会形成这样的关系：
// rawState -> "count" -> Set(renderEffect)
const bucket = new WeakMap()

// reactiveCache 用来保证同一个原始对象多次 reactive() 后，拿到的是同一个代理对象。
//
// 这不是响应式的核心思想，但它能避免重复创建 Proxy，也更接近 Vue 的行为：
// reactive(raw) === reactive(raw)
const reactiveCache = new WeakMap()

function isObject(value) {
  return value !== null && typeof value === 'object'
}

function effect(fn, label = '未命名 effect') {
  // effectFn 是真正会被收集、被 trigger 重新执行的函数。
  // 外面包这一层，是为了在执行用户传进来的 fn 之前设置 activeEffect，
  // 这样 fn 内部读取 reactive 属性时，track() 才知道应该收集谁。
  const effectFn = () => {
    activeEffect = effectFn
    console.log(`[effect:开始] ${effectFn.label}`)

    try {
      // fn 执行期间，如果读取了 state.count，就会进入 Proxy get，
      // 随后 get 会调用 track(target, "count")。
      fn()
    } finally {
      // fn 运行结束后必须清空 activeEffect。
      //
      // 否则普通代码里的属性读取，比如 console.log(state.count)，
      // 也会被错误地收集为依赖。
      activeEffect = undefined
      console.log(`[effect:结束] ${effectFn.label}`)
    }
  }
  effectFn.label = label

  // 注册 effect 时先执行一次。
  // 这一步很关键：只有先执行，才能触发 getter，才能完成第一次依赖收集。
  // 如果不执行，响应式系统并不知道这个 effect 依赖了哪些属性。
  effectFn()

  // 返回 runner，方便外部手动重新执行。这个 demo 里暂时没有用到。
  return effectFn
}

function track(target, key) {
  // 读取 reactive 属性不一定都会收集依赖。
  // 只有“某个 effect 正在运行时”的读取才需要被追踪。
  // 这也是理解解构断联的关键：如果解构发生在 effect 外面，
  // 那次读取虽然经过了 get，但 activeEffect 为空，所以不会建立依赖关系。
  if (!activeEffect) {
    console.log(`[track:skip] 读取了 ${String(key)}，但当前没有正在运行的 effect`)
    return
  }

  // 先找到这个原始对象对应的 depsMap。
  // 如果这个对象从来没被追踪过，就创建一张新的 Map。
  let depsMap = bucket.get(target)

  if (!depsMap) {
    depsMap = new Map()
    bucket.set(target, depsMap)
  }

  // 再找到这个属性对应的依赖集合。
  // 如果这个属性从来没被 effect 读取过，就创建一个新的 Set。
  let deps = depsMap.get(key)
  if (!deps) {
    deps = new Set()
    depsMap.set(key, deps)
  }

  // 最后把当前 effect 放进依赖集合。
  // Set 可以天然去重，所以同一个 effect 多次读取 state.count，
  // 依赖集合里也只会保存一份。
  deps.add(activeEffect)

  console.log(7777, target, key, depsMap, deps)

  console.log(`[track] 收集依赖：${activeEffect.label} 依赖 "${String(key)}"`)
}

function trigger(target, key) {
  // set 发生时，先沿着同样的路径反向查找：
  // 这个对象的这个属性，到底有哪些 effect 依赖它？
  const depsMap = bucket.get(target)
  // console.log('depsMap', depsMap)

  const deps = depsMap?.get(key)

  // 如果没有依赖，说明这个属性虽然变了，但没有任何 effect 需要因此重新执行。
  //
  // 解构断联的案例最终就会走到这里：
  // effect 里读的是普通变量 count，而不是 state.count，
  // 所以 "count" 这个属性没有收集到对应的 effect。
  if (!deps?.size) {
    console.log(`[trigger:无依赖] "${String(key)}" 已变化，但没有 effect 依赖它`)
    return
  }

  console.log(
    `[trigger] "${String(key)}" 已变化，重新执行：${[...deps]
      .map((effectFn) => effectFn.label)
      .join(', ')}`,
  )

  // 真实 Vue 会有调度器，会把更新合并、排队，然后在合适的时机刷新组件。
  // 这里为了方便调试，直接同步执行所有依赖这个 key 的 effect。
  deps.forEach((effectFn) => effectFn())
}

function reactive(raw) {
  if (!isObject(raw)) {
    return raw
  }
  // 如果同一个对象已经被代理过，直接复用之前的 Proxy。
  // 这样可以避免重复代理，也能保持对象身份稳定。
  const cachedProxy = reactiveCache.get(raw)
  if (cachedProxy) {
    return cachedProxy
  }

  // reactive 的核心就是这层 Proxy。
  // Vue 不是在“变量名”上做追踪，而是在“代理对象的属性访问”上做追踪。
  // 因此只有代码真的走到 proxy.get，响应式系统才有机会调用 track()。
  const proxy = new Proxy(raw, {
    get(target, key, receiver) {
      /**
       *  1. target：被代理的原始对象
       *  2. key：正在读取的属性名
       *  3. receiver: 代理对象的本身
       */
      // 只要读取 state.count，就会先进入这里。
      console.log(`[proxy:get] 读取属性：${String(key)}`)

      // 在 get 中收集依赖：
      // “当前 effect 依赖了 target 对象上的 key 属性”。
      track(target, key)

      // Reflect.get 比 target[key] 更接近语言层面的属性读取语义，
      // 尤其是在 getter、原型链、this 绑定等场景下更稳。
      const value = Reflect.get(target, key, receiver)
      // 这里做一层懒代理：只有当嵌套对象真的被读取时，才继续 reactive。
      //
      // 例如 state.user.name：
      // 1. 先读取 state.user，代理外层对象的 user。
      // 2. user 是对象，所以这里返回 reactive(user)。
      // 3. 再读取 user.name，进入内层对象的 get。
      return isObject(value) ? reactive(value) : value
    },

    set(target, key, value, receiver) {
      // 保存旧值，用来判断这次 set 是否真的改变了数据。
      const oldValue = target[key]

      // Reflect.set 同样更接近语言层面的赋值语义。
      // 它会返回一个布尔值，表示赋值是否成功。
      const result = Reflect.set(target, key, value, receiver)

      console.log(`[proxy:set] 设置属性 ${String(key)}：${oldValue} -> ${value}`)

      // 值没有变化时，不需要触发依赖更新。
      if (!Object.is(oldValue, value)) {
        // 在 set 中触发更新：
        // “target 对象上的 key 属性变了，重新执行依赖它的 effect”。
        trigger(target, key)
      }

      return result
    },
  })

  reactiveCache.set(raw, proxy)
  return proxy
}

export { effect, reactive }
