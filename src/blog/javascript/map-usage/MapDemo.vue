<template>
  <section class="demo-panel">
    <header class="panel-head">
      <h2>reactive(new Map())</h2>
    </header>
    <div class="controls">
      <span>已选 {{ selectedMap.size }} 项</span>
      <button type="button" @click="selectAll">全选</button>
      <button type="button" @click="clearSelected">清空</button>
    </div>
    <ul class="item-list">
      <li v-for="item in goods" :key="item.id">
        <label>
          <input type="checkbox" :checked="selectedMap.has(item.id)" @change="toggleItem(item)" />
          {{ item.name }}
        </label>
        <span>￥{{ item.price }}</span>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { reactive } from 'vue'
import { goods } from './order-data.js'

// Vue 3 可以让 Map 响应式化，set、delete、clear、size、has 都能参与页面更新。
// 这里的结构是 Map<商品 id, 商品对象>，适合把“是否选中”和“选中项详情”放在同一个映射里。
const selectedMap = reactive(new Map())

const toggleItem = (item) => {
  // has 用来判断 key 是否存在，比从数组中 includes 查找更贴合“映射表”的语义。
  if (selectedMap.has(item.id)) {
    // delete 只删除当前商品 id 对应的选中项，不需要手动重建数组。
    selectedMap.delete(item.id)
    return
  }

  // set 可以直接保存完整商品对象，后续要读取选中详情时不需要再回到 goods 中查找。
  selectedMap.set(item.id, item)
}

const selectAll = () => {
  goods.forEach((item) => {
    selectedMap.set(item.id, item)
  })
}

const clearSelected = () => {
  // clear 是 Map 自带的清空方法，比逐个删除 key 更直接。
  selectedMap.clear()
}
</script>

<style lang="less" scoped>
.demo-panel {
  min-width: 0;
  padding: 18px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;

  h2 {
    margin: 2px 0 0;
    font-size: 18px;
    line-height: 1.3;
  }
}

.controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;

  button {
    padding: 4px 10px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    background: #fff;
    cursor: pointer;
  }

  button:hover {
    border-color: #9ca3af;
  }
}

.item-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid #e5e7eb;

  li {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 10px 0;
    border-bottom: 1px solid #e5e7eb;
  }

  label {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}
</style>
