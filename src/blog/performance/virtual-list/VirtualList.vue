<template>
  <section class="list-card">
    <header class="list-header">
      <div>
        <h2>虚拟列表</h2>
        <p>只渲染视口附近数据</p>
      </div>
      <span>{{ showData.length }} 个节点</span>
    </header>
    <div class="list-view" :style="{ height: `${viewHeight}px` }" @scroll="onScroll">
      <div class="list-space" :style="{ height: `${fullHeight}px` }">
        <ul class="list-body" :style="{ transform: `translateY(${moveY}px)` }">
          <li v-for="item in showData" :key="item.id" class="list-item">
            <strong>#{{ item.id }}</strong>
            <span>{{ item.title }}</span>
            <em>{{ item.status }}</em>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'

interface ListItem {
  id: number
  title: string
  status: string
}

const props = withDefaults(
  defineProps<{
    total?: number
    rowHeight?: number
    viewHeight?: number
    buffer?: number
  }>(),
  {
    total: 10000,
    rowHeight: 64,
    viewHeight: 520,
    buffer: 6,
  },
)

const scrollTop = ref(0)

const viewHeight = computed(() => props.viewHeight)
const listData = computed<ListItem[]>(() =>
  Array.from({ length: props.total }, (_, index) => ({
    id: index + 1,
    title: `订单渲染任务 ${index + 1}`,
    status: index % 3 === 0 ? '待处理' : index % 3 === 1 ? '执行中' : '已完成',
  })),
)

const fullHeight = computed(() => props.total * props.rowHeight)
const start = computed(() =>
  Math.max(Math.floor(scrollTop.value / props.rowHeight) - props.buffer, 0),
)
const showCount = computed(() => Math.ceil(props.viewHeight / props.rowHeight))
const end = computed(() =>
  Math.min(showCount.value + start.value + props.buffer * 2, listData.value.length),
)
const showData = computed(() => listData.value.slice(start.value, end.value))
const moveY = computed(() => start.value * props.rowHeight)

const onScroll = (e: Event) => {
  scrollTop.value = (e.target as HTMLElement).scrollTop
}
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
  color: #1e80ff;
  font-size: 14px;
}

.list-view {
  overflow: auto;
  border: 1px solid #e4e6eb;
  border-radius: 8px;
  background: #f7f8fa;
}

.list-space {
  position: relative;
}

.list-body {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  margin: 0;
  padding: 0 8px;
  list-style: none;
  will-change: transform;
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
