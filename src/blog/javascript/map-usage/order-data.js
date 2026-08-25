// 模拟两次接口返回的数据，点击“刷新接口数据”时会在这两组数据之间切换。
export const apiOrderVersions = [
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
    },
    {
      orderId: '1003',
      customerName: '王五',
      orderStatus: '部分收款',
      receivableAmount: 120,
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
      orderStatus: '部分收款',
      receivableAmount: 120,
      receivedAmount: 0
    },
    {
      orderId: '1004',
      customerName: '赵六',
      orderStatus: '新订单',
      receivableAmount: 480,
      receivedAmount: 0
    }
  ]
]

export const goods = [
  { id: 101, name: '键盘', price: 299 },
  { id: 102, name: '鼠标', price: 189 },
  { id: 103, name: '显示器支架', price: 129 }
]
