---
title: "别再只会 `find` 了：Map 在前端业务里的真实用法"
description: "很多前端同学知道 Map ，但真正写业务时却很少用。 原因也很简单：接口返回的数据通常是数组，表单提交的数据通常是对象或数组，最后给后端的也是 JSON。大多数时候，数组和普通对象已经够用了。 但有一类问题，只要出现， Map 就会非常顺手"
pubDate: "2026-08-21"
category: "JavaScript 实战"
categorySlug: "javascript"
tags: ["Map"]
difficulty: 3
source: "vue-practice/src/views/javascript/map-usage/index.md"
---
很多前端同学知道 `Map`，但真正写业务时却很少用。

原因也很简单：接口返回的数据通常是数组，表单提交的数据通常是对象或数组，最后给后端的也是 JSON。大多数时候，数组和普通对象已经够用了。

但有一类问题，只要出现，`Map` 就会非常顺手：

> 根据一个唯一 key，快速找到对应的数据。

换句话说，`Map` 的核心价值不是“存数据”，而是把一组数据整理成一张索引表。

这篇文章用三个场景说明：

- 什么时候数组更合适。
- 什么时候可以用 `Map` 管理选中项。
- 接口刷新后如何用 `Map` 保留用户编辑。

示例代码使用 Vue 3，但核心思路不依赖 Vue。

## 先看一个判断标准

当你写出这种代码时，就可以想一下是不是该用 `Map`：

```js
listA.map(itemA => {
  const itemB = listB.find(itemB => itemB.id === itemA.id)
})
```

这段代码本身没有错。

但它背后的信号是：你正在根据 `id` 从另一组列表里查数据。

如果这种查找只发生一两次，`find` 很直观。但如果它出现在循环里，数据量又比较大，就会变成反复扫描：

```js
listA.length === 1000
listB.length === 1000
```

最坏情况下，每一条 `listA` 都要把 `listB` 找一遍，也就是：

```js
1000 * 1000
```

这时可以先把 `listB` 建成索引：

```js
const listBMap = new Map(listB.map(itemB => [itemB.id, itemB]))

listA.map(itemA => {
  const itemB = listBMap.get(itemA.id)
})
```

它分成两步：

1. 先把数组整理成 `Map`。
2. 后面直接通过 `key` 获取数据。

原始数组：

```js
const listB = [
  { id: 1, name: 'A' },
  { id: 2, name: 'B' },
  { id: 3, name: 'C' }
]
```

整理成 `Map` 后，可以理解成：

```text
1 => { id: 1, name: 'A' }
2 => { id: 2, name: 'B' }
3 => { id: 3, name: 'C' }
```

核心差异是：

> `find`：每次都重新找一遍。  
> `Map`：提前建索引，后面直接查。

## 场景一：简单 checkbox，用数组就够了

先看一个最常见的场景：商品多选。

页面上有三件商品，用户可以勾选、全选、清空。如果最终只需要提交选中的商品 id，那么数组就是最轻的方案。

```js
const goods = [
  { id: 101, name: '键盘', price: 299 },
  { id: 102, name: '鼠标', price: 189 },
  { id: 103, name: '显示器支架', price: 129 }
]
```

Vue 里可以直接这样写：

```vue
<template>
  <section>
    <p>已选 {{ selectedIds.length }} 项</p>

    <button type="button" @click="selectAll">全选</button>
    <button type="button" @click="clearSelected">清空</button>

    <label v-for="item in goods" :key="item.id">
      <input v-model="selectedIds" type="checkbox" :value="item.id" />
      {{ item.name }}
    </label>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const goods = [
  { id: 101, name: '键盘', price: 299 },
  { id: 102, name: '鼠标', price: 189 },
  { id: 103, name: '显示器支架', price: 129 }
]

const selectedIds = ref([])

const selectAll = () => {
  selectedIds.value = goods.map(item => item.id)
}

const clearSelected = () => {
  selectedIds.value = []
}
</script>
```

这里最终拿到的是：

```js
[101, 102, 103]
```

这个结构非常适合提交接口。

所以第一个结论是：

> 简单表单值，不要为了用 `Map` 而用 `Map`。数组更简单，也更符合表单语义。

## 场景二：选中项需要完整对象，可以考虑 Map

还是商品多选。

如果业务不只关心商品 id，还经常需要直接拿到选中的商品对象，比如展示选中商品详情、计算总价、做局部删除，这时 `Map` 会更自然。

结构可以设计成：

```text
商品 id -> 商品对象
```

对应代码：

```vue
<template>
  <section>
    <p>已选 {{ selectedMap.size }} 项</p>

    <button type="button" @click="selectAll">全选</button>
    <button type="button" @click="clearSelected">清空</button>

    <label v-for="item in goods" :key="item.id">
      <input type="checkbox" :checked="selectedMap.has(item.id)" @change="toggleItem(item)" />
      {{ item.name }}
    </label>
  </section>
</template>

<script setup>
import { reactive } from 'vue'

const goods = [
  { id: 101, name: '键盘', price: 299 },
  { id: 102, name: '鼠标', price: 189 },
  { id: 103, name: '显示器支架', price: 129 }
]

const selectedMap = reactive(new Map())

const toggleItem = item => {
  if (selectedMap.has(item.id)) {
    selectedMap.delete(item.id)
    return
  }

  selectedMap.set(item.id, item)
}

const selectAll = () => {
  goods.forEach(item => {
    selectedMap.set(item.id, item)
  })
}

const clearSelected = () => {
  selectedMap.clear()
}
</script>
```

这段代码读起来很贴近业务：

- `has`：这个商品是否已选。
- `set`：选中这个商品。
- `delete`：取消选中这个商品。
- `clear`：清空所有选中。
- `size`：当前选中了多少项。

如果后续要拿某个选中商品，也不需要再回到原数组里 `find`：

```js
selectedMap.get(101)
```

不过，这个场景依然不是说“商品多选必须用 `Map`”。

真正的判断标准是：

> 如果你只需要 id 数组，用数组。  
> 如果你经常通过 id 判断、删除、读取完整对象，可以考虑 `Map`。

## 场景三：接口刷新后，保留用户编辑

这个场景更接近真实业务。

假设有一个批量收款表格：

1. 接口返回一批订单。
2. 用户填写“本次收款”和“备注”。
3. 页面刷新接口数据，订单状态、应收金额可能发生变化。
4. 但用户刚刚填写的内容不能丢。

这里会同时存在两类数据：

```text
接口数据：订单号、客户、状态、应收金额
用户编辑：本次收款、备注
```

目标也很明确：

- 订单号、客户、状态、应收金额，以接口最新数据为准。
- 本次收款、备注，以用户当前编辑为准。
- 表格顺序，以接口返回顺序为准。

先准备两版接口数据，用来模拟刷新：

```js
const apiOrderVersions = [
  [
    {
      orderId: '1001',
      customerName: '张三',
      orderStatus: '待收款',
      receivableAmount: 200,
      receivedAmount: 0
    },
    {
      orderId: '1002',
      customerName: '李四',
      orderStatus: '待收款',
      receivableAmount: 350,
      receivedAmount: 0
    }
  ],
  [
    {
      orderId: '1001',
      customerName: '张三',
      orderStatus: '部分收款',
      receivableAmount: 210,
      receivedAmount: 0
    },
    {
      orderId: '1002',
      customerName: '李四',
      orderStatus: '待收款',
      receivableAmount: 350,
      receivedAmount: 0
    },
    {
      orderId: '1003',
      customerName: '王五',
      orderStatus: '新订单',
      receivableAmount: 480,
      receivedAmount: 0
    }
  ]
]
```

用户编辑用 `Map` 保存：

```js
const selectedOrderMap = reactive(new Map())
```

它表达的是：

```text
订单号 -> 用户编辑字段
```

例如：

```text
'1001' => {
  receivedAmount: 120,
  remark: '线下已收款'
}
```

## 为什么订单刷新适合用 Map

问题的关键是：

> 每一条接口订单，都要找到它对应的用户编辑记录。

如果不用 `Map`，很容易写成：

```js
const selectedOrder = selectedOrders.find(order => order.orderId === row.orderId)
```

当这段逻辑出现在 `map` 里时，就会变成：

```js
orderRows.map(row => {
  const selectedOrder = selectedOrders.find(order => order.orderId === row.orderId)
})
```

也就是每处理一行接口数据，都要重新扫描一次用户编辑列表。

用 `Map` 后，保存编辑状态时直接按订单号写入：

```js
const updateOrder = row => {
  row.remainingAmount = row.receivableAmount - row.receivedAmount

  selectedOrderMap.set(row.orderId, {
    receivedAmount: row.receivedAmount,
    remark: row.remark
  })
}
```

这里不需要判断新增还是替换：

- 第一次编辑某个订单，`set` 会新增。
- 再次编辑同一个订单，`set` 会覆盖。
- 同一个 `orderId` 在 `Map` 中只会有一份编辑记录。

## 合并接口数据和用户编辑

生成表格行时，以接口数据为基础，再合并用户编辑：

```js
const createOrderRows = () => {
  return apiOrderVersions[apiVersionIndex.value].map(row => {
    const mergedRow = {
      ...row,
      ...selectedOrderMap.get(row.orderId)
    }

    return {
      ...mergedRow,
      remainingAmount: mergedRow.receivableAmount - mergedRow.receivedAmount
    }
  })
}
```

这段代码对应的业务模型是：

```text
接口订单行 -> 按订单号读取用户编辑 -> 生成表格可编辑行
```

注意这里的展开顺序：

```js
{
  ...row,
  ...selectedOrderMap.get(row.orderId)
}
```

先展开接口行，再展开用户编辑。

这样用户刚刚填的 `receivedAmount` 和 `remark` 可以覆盖接口默认值。

同时，表格行是通过对象展开生成的新对象：

```js
const mergedRow = {
  ...row,
  ...selectedOrderMap.get(row.orderId)
}
```

对于这种扁平订单对象来说，这样就可以避免 `v-model` 直接修改原始接口数据，不需要再写 `JSON.parse(JSON.stringify(...))`。

## Map 里不要保存整行订单

这里有一个很重要的细节。

保存用户编辑时，推荐只保存用户真正会改的字段：

```js
selectedOrderMap.set(row.orderId, {
  receivedAmount: row.receivedAmount,
  remark: row.remark
})
```

不要写成：

```js
selectedOrderMap.set(row.orderId, {
  ...row,
  receivedAmount: row.receivedAmount,
  remark: row.remark
})
```

因为 `...row` 会把接口字段也存进去，例如：

- `customerName`
- `orderStatus`
- `receivableAmount`
- `remainingAmount`

刷新接口后，如果再这样合并：

```js
{
  ...row,
  ...selectedOrderMap.get(row.orderId)
}
```

旧的整行订单就可能把接口刚返回的新状态、新应收金额覆盖掉。

所以这个案例里要分清楚两类字段：

| 字段来源 | 字段示例                                          | 处理方式               |
| -------- | ------------------------------------------------- | ---------------------- |
| 接口数据 | `customerName`、`orderStatus`、`receivableAmount` | 每次刷新都以接口为准   |
| 用户编辑 | `receivedAmount`、`remark`                        | 存到 `Map`，刷新后合并 |

这比“整行保存再整行覆盖”更安全。

## 完整核心代码

去掉样式和表格细节后，核心代码其实不多：

```vue
<script setup>
import { computed, reactive, ref } from 'vue'

const apiVersionIndex = ref(0)
const selectedOrderMap = reactive(new Map())
const apiVersionLabel = computed(() => `${apiVersionIndex.value + 1} / ${apiOrderVersions.length}`)

const createOrderRows = () => {
  return apiOrderVersions[apiVersionIndex.value].map(row => {
    const mergedRow = {
      ...row,
      ...selectedOrderMap.get(row.orderId)
    }

    return {
      ...mergedRow,
      remainingAmount: mergedRow.receivableAmount - mergedRow.receivedAmount
    }
  })
}

const orderRows = ref(createOrderRows())

const updateOrder = row => {
  row.remainingAmount = row.receivableAmount - row.receivedAmount

  selectedOrderMap.set(row.orderId, {
    receivedAmount: row.receivedAmount,
    remark: row.remark
  })
}

const refreshOrders = () => {
  apiVersionIndex.value = (apiVersionIndex.value + 1) % apiOrderVersions.length
  orderRows.value = createOrderRows()
}

const resetDemo = () => {
  apiVersionIndex.value = 0
  selectedOrderMap.clear()
  orderRows.value = createOrderRows()
}
</script>
```

刷新时不清空 `selectedOrderMap`，所以用户输入还在。

重置时清空 `selectedOrderMap`，页面回到第一版接口数据。

## 三个场景放在一起看

| 场景                   | 数据结构                 | 适合原因                                        |
| ---------------------- | ------------------------ | ----------------------------------------------- |
| 简单 checkbox 表单值   | `id[]`                   | 轻量，适合直接提交接口。                        |
| 选中项需要保存完整对象 | `Map<id, item>`          | 方便判断、删除，并且可以直接通过 id 读取对象。  |
| 接口刷新后保留用户编辑 | `Map<orderId, editData>` | 按业务 key 保留临时编辑，再合并回最新接口数据。 |

## 什么时候你该想到 Map

当你频繁写出这些代码时，可以考虑 `Map`：

```js
arrayA.map(itemA => {
  arrayB.find(itemB => itemB.id === itemA.id)
})
```

```js
selectedList.some(item => item.id === id)
```

```js
selectedList.filter(item => item.id !== id)
```

不是说这些写法都必须替换。

它们只是提醒你：这里可能存在一层“key 到数据”的映射关系。

如果这个映射关系只是临时写一两次，用数组就行。

如果这个映射关系已经是业务核心，`Map` 就值得出场。

## 最后总结

`Map` 在前端业务里不算高频，因为很多数据最终还是要回到 JSON。

但当问题变成“根据 key 找数据”时，它非常好用：

- 列表选中态需要保存完整对象。
- 需要通过 id 快速判断某条数据是否存在。
- 两组列表需要按业务 key 合并。
- 刷新接口后要保留用户临时编辑。
- 不想在循环里反复 `find`。

简单表单用数组，固定配置用对象。

但只要你开始围绕某个唯一 key 做查找、合并、覆盖，`Map` 就是一个很值得考虑的工具。
