<template>
  <section class="demo-panel order-merge-demo">
    <header class="panel-head">
      <h2>刷新订单行并保留用户编辑</h2>
    </header>
    <div class="controls">
      <span>接口版本 {{ apiVersionLabel }}</span>
      <button type="button" @click="refreshOrders">刷新接口数据</button>
      <button type="button" @click="resetDemo">重置</button>
    </div>
    <div class="table-wrap">
      <table class="order-table">
        <thead>
          <tr>
            <th>订单号</th>
            <th>客户</th>
            <th>状态</th>
            <th>应收</th>
            <th>本次收款</th>
            <th>剩余</th>
            <th>备注</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in orderRows" :key="row.orderId">
            <td>{{ row.orderId }}</td>
            <td>{{ row.customerName }}</td>
            <td>{{ row.orderStatus }}</td>
            <td>￥{{ row.receivableAmount }}</td>
            <td>
              <input
                v-model.number="row.receivedAmount"
                class="amount-input"
                type="number"
                min="0"
                @blur="updateOrder(row)"
              />
            </td>
            <td>￥{{ row.remainingAmount }}</td>
            <td>
              <input
                v-model="row.remark"
                class="remark-input"
                type="text"
                @blur="updateOrder(row)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { apiOrderVersions } from './order-data.js'

const apiVersionIndex = ref(0)
const selectedOrderMap = reactive(new Map())
const apiVersionLabel = computed(() => `${apiVersionIndex.value + 1} / ${apiOrderVersions.length}`)

const createOrderRows = () => {
  return apiOrderVersions[apiVersionIndex.value].map((row) => {
    // row 是接口原始数据；这里用对象展开生成新对象，避免 v-model 改到 apiOrderVersions。
    const mergedRow = {
      ...row,
      ...selectedOrderMap.get(row.orderId),
    }
    return {
      ...mergedRow,
      remainingAmount: mergedRow.receivableAmount - mergedRow.receivedAmount,
    }
  })
}

const orderRows = ref(createOrderRows())

const updateOrder = (row) => {
  row.remainingAmount = row.receivableAmount - row.receivedAmount
  // Map 只保存用户编辑字段；同一个 orderId 重复 set 会直接覆盖旧值。
  selectedOrderMap.set(row.orderId, {
    receivedAmount: row.receivedAmount,
    remark: row.remark,
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

<style lang="less" scoped>
.demo-panel {
  min-width: 0;
  padding: 18px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
}

.order-merge-demo {
  margin-top: 16px;
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

.table-wrap {
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.order-table {
  width: 100%;
  min-width: 820px;
  border-collapse: collapse;
  background: #fff;

  th,
  td {
    padding: 10px;
    border-bottom: 1px solid #e5e7eb;
    text-align: left;
    white-space: nowrap;
  }

  th {
    background: #f9fafb;
    color: #374151;
    font-size: 13px;
  }

  tr:last-child td {
    border-bottom: 0;
  }
}

.amount-input,
.remark-input {
  width: 100%;
  min-width: 96px;
  box-sizing: border-box;
  padding: 5px 7px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  color: #1f2937;
}

.remark-input {
  min-width: 140px;
}
</style>
