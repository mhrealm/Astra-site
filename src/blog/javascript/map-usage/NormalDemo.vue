<template>
  <section class="demo-panel">
    <header class="panel-head">
      <h2>ref([]) + v-model</h2>
    </header>
    <div class="controls">
      <span>已选 {{ selectedIds.length }} 项</span>
      <button type="button" @click="selectAll">全选</button>
      <button type="button" @click="clearSelected">清空</button>
    </div>

    <ul class="item-list">
      <li v-for="item in goods" :key="item.id">
        <label>
          <input v-model="selectedIds" type="checkbox" :value="item.id" />
          {{ item.name }}
        </label>
        <span>￥{{ item.price }}</span>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { goods } from './order-data.js'

// 普通写法通常只保存选中的 id，结构简单，天然适合表单提交和接口字段。
const selectedIds = ref([])

const selectAll = () => {
  // 全选时只生成 id 数组，页面的 checkbox 会由 v-model 自动同步选中状态。
  selectedIds.value = goods.map(item => item.id)
}

const clearSelected = () => {
  selectedIds.value = []
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
