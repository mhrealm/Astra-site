<template>
  <section class="list-card">
    <header class="list-header">
      <div>
        <h2>普通列表</h2>
        <p>一次性渲染完整数据</p>
      </div>
      <span>{{ listData.length }} 个节点</span>
    </header>
    <div class="list-view" :style="{ height: `${viewHeight}px` }">
      <ul class="list-body">
        <li v-for="item in listData" :key="item.id" class="list-item">
          <strong>#{{ item.id }}</strong>
          <span>{{ item.title }}</span>
          <em>{{ item.status }}</em>
        </li>
      </ul>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

interface ListItem {
  id: number
  title: string
  status: string
}

const props = withDefaults(
  defineProps<{
    total?: number
    viewHeight?: number
  }>(),
  {
    total: 10000,
    viewHeight: 520,
  },
)

const viewHeight = computed(() => props.viewHeight)
const listData = computed<ListItem[]>(() =>
  Array.from({ length: props.total }, (_, index) => ({
    id: index + 1,
    title: `订单渲染任务 ${index + 1}`,
    status: index % 3 === 0 ? '待处理' : index % 3 === 1 ? '执行中' : '已完成',
  })),
)
</script>

<style lang="less" scoped>
.list-card {
  border: 1px solid #e4e6eb;
  border-radius: 8px;
  background: #fff;
  padding: 20px;
  box-shadow: 0 2px 12px rgb(29 33 41 / 4%);
}

.list-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.list-header h2,
.list-header p {
  margin: 0;
}

.list-header h2 {
  font-size: 22px;
  font-weight: 700;
}

.list-header p {
  margin-top: 6px;
  color: #8a919f;
  font-size: 13px;
}

.list-header span {
  color: #f53f3f;
  font-size: 14px;
}

.list-view {
  overflow: auto;
  border: 1px solid #e4e6eb;
  border-radius: 8px;
  background: #f7f8fa;
}

.list-body {
  margin: 0;
  padding: 0 8px;
  list-style: none;
}

.list-item {
  display: grid;
  grid-template-columns: 90px 1fr 82px;
  align-items: center;
  box-sizing: border-box;
  height: 56px;
  margin-bottom: 8px;
  border: 1px solid #e4e6eb;
  border-radius: 8px;
  background: #fff;
  padding: 0 16px;
}

.list-item strong {
  color: #1d2129;
}

.list-item span {
  min-width: 0;
  overflow: hidden;
  color: #515767;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-item em {
  justify-self: end;
  color: #00b453;
  font-style: normal;
}
</style>
