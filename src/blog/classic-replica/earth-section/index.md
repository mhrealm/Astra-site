---
title: '我决定写一个 3D 地球仪来记录下我去过的地方'
description: '前言 你想去南极吗？那里是地球最后的留白。去看那万年不化的冰川在阳光下透着幽幽的深蓝色。 你想去北极吗？站在世界的顶点，等一场美到窒息的极光。 你想去非洲萨瓦那吗？那是离赤道最近的金色草原。听万千角马奔腾而过的蹄声，感受那种野性而滚烫的生命'
pubDate: '2025-01-17'
category: '经典复刻'
categorySlug: 'classic-replica'
tags: ['动效']
difficulty: 5
source: 'vue-practice/src/views/classic-replica/earth-section/index.md'
demoSlug: 'classic-replica-earth-section'
---

## 前言

你想去南极吗？那里是地球最后的留白。去看那万年不化的冰川在阳光下透着幽幽的深蓝色。
你想去北极吗？站在世界的顶点，等一场美到窒息的极光。
你想去非洲萨瓦那吗？那是离赤道最近的金色草原。听万千角马奔腾而过的蹄声，感受那种野性而滚烫的生命力，在耳边呼啸而过。
你想去南美亚马逊吗？钻进那片被称为“地球肺叶”的雨林，听雨水噼里啪啦地敲在宽大的树叶上。
你想去热带海岛吗？去看海水从浅浅的薄荷绿慢慢变成深邃的宝石蓝。
你想去崖边海岸吗？去海边的悬崖。看守护在悬崖尽头的灯塔。
你想去欧洲古镇吗？踩在湿漉漉的石板路上，听风铃在街角清脆地响。
你想去赛博都市吗？去感受雨后的街道的霓虹倒影，高耸入云的大楼在水雾里若隐若现。

<!-- 表情图 -->

醒醒吧！！起来当牛马了...

## globe.gl 的介绍

虽然上面的地方我一个都没有去过，但是没有关系，作为一名程序员，我只需要动动手指就可以在地球上找到他们。

话不多说，说干就干！！

这次我决定用 globe.gl 去实现，至于啥是 globe.gl 呢？

简单来说，它是一个基于 Three.js 封装的开源 JavaScript 组件，专门用来进行 **地球空间数据的可视化**。它的强大之处在于：你不需要写复杂的 WebGL 底层代码，就可以做出一个 3D 交互式地球。

为什么选择它呢？

因为它足够简单，下面是实用资源。

- 官网/演示地址：[globe.gl](https://globe.gl/) (里面有几十个 Demo，点击就能看源码)

- GitHub：[vasturiano/globe.gl](https://github.com/vasturiano/globe.gl)

## 快速开始

先看效果图

代码预览

```vue
<template>
  <section class="floor3-container floor-container" ref="containerRef">
    <div class="sticky">
      <div id="chart__container" ref="chartRef"></div>
      <div class="text" ref="textRef">
        <p class="title">Earth: A Never-Ending Dream</p>
        <p class="desc">
          The flickers on this map are more than just distant auroras and waves; they are our
          deepest gaze upon this planet. From the golden savannas to the neon-lit streets after
          rain, stories are unfolding quietly in every corner of the world.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import Globe from 'globe.gl'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import earthImg from './earth-night.jpg?url'
import skyImg from './night-sky.png?url'

gsap.registerPlugin(ScrollTrigger)
const containerRef = ref(null)
const chartRef = ref(null)
const textRef = ref(null)
const highlightIndex = ref(-1)
let world = null
let highlightTimer = null
let resizeObserver = null
let introTween = null

const initData = [
  { name: 'Antarctica', value: [0, -82.8628, 0], zIndex: 0 },
  { name: 'The Arctic', value: [0, 90, 0], zIndex: 1 },
  { name: 'Savanna', value: [34.8888, -2.3333, 0], zIndex: 2 },
  { name: 'Amazon', value: [-62.2159, -3.4653, 0], zIndex: 3 },
  { name: 'Maldives', value: [73.2207, 3.2028, 0], zIndex: 4 },
  { name: 'Cliffs of Moher', value: [-9.4309, 52.9719, 0], zIndex: 5 },
  { name: 'Prague', value: [14.4378, 50.0755, 0], zIndex: 6 },
  { name: 'Tokyo', value: [139.6503, 35.6762, 0], zIndex: 7 },
]

onMounted(() => {
  const chart = chartRef.value

  if (!chart) {
    return
  }

  const getChartSize = () => {
    const { width, height } = chart.getBoundingClientRect()

    return {
      width: Math.max(1, Math.floor(width)),
      height: Math.max(1, Math.floor(height)),
    }
  }

  const getPointOfView = (width, height) => ({
    lat: 36.818188,
    lng: 12.227512,
    altitude: width / height > 1.8 ? 3.2 : 3.6,
  })

  const { width, height } = getChartSize()

  // 初始化地球
  world = Globe()(chart)
    .width(width) // 设置地球画布的宽度
    .height(height)
    .globeImageUrl(earthImg) // 设置地球表面的贴图
    .backgroundImageUrl(skyImg) // 设置背景图
    .atmosphereColor('#ffb4ff') // 设置地球周围“大气层”的光晕颜色
    .atmosphereAltitude(0.06) // 设置大气层的厚度
    .pointOfView(getPointOfView(width, height))
    .labelsData(initData) // 注入数据源
    .labelLat((d) => d.value[1]) // 数据里的纬度在 value 数组的第 2 个位置
    .labelLng((d) => d.value[0])
    .labelText((d) => d.name) // 显示在地球上的文字内容
    .labelSize((d) => (initData.indexOf(d) === highlightIndex.value ? 2.5 : 1.6)) // 文字的大小
    .labelColor(() => 'rgba(255, 165, 0, 0.75)') // 文字的颜色
    .labelDotRadius((d) => {
      return initData.indexOf(d) === highlightIndex.value ? 1.2 : 0.5
    })
    .enablePointerInteraction(true) // 开启鼠标交互

  const controls = world.controls() // 交互控制器
  controls.enableZoom = false // 禁用缩放
  controls.enablePan = false // 禁用平移
  controls.autoRotate = true // 开启自动旋转
  controls.autoRotateSpeed = -1 // 设置旋转速度和方向 负值代表是逆时针

  // 自动高亮循环
  highlightTimer = window.setInterval(() => {
    const scheduleIdle =
      window.requestIdleCallback ?? ((callback) => window.setTimeout(callback, 1))
    scheduleIdle(() => {
      highlightIndex.value = (highlightIndex.value + 1) % initData.length
      world.labelsData([...initData])
    })
  }, 2000)

  const scrollContainer = containerRef.value?.closest('.demo-stage')

  // 文案进度绑定到演示区域自身的滚动条。
  introTween = gsap.fromTo(
    textRef.value,
    { y: 64, opacity: 0 },
    {
      y: 0,
      opacity: 0.84,
      ease: 'none',
      scrollTrigger: {
        trigger: containerRef.value,
        scroller: scrollContainer ?? undefined,
        start: 'top top',
        end: '+=45%',
        scrub: 1,
      },
    },
  )

  resizeObserver = new ResizeObserver(() => {
    if (!world) {
      return
    }

    const nextSize = getChartSize()
    world.width(nextSize.width)
    world.height(nextSize.height)
    world.pointOfView(getPointOfView(nextSize.width, nextSize.height), 0)
  })
  resizeObserver.observe(chart)
})

onBeforeUnmount(() => {
  if (highlightTimer !== null) {
    window.clearInterval(highlightTimer)
  }

  resizeObserver?.disconnect()
  introTween?.kill()
  world?._destructor?.()
})
</script>

<style scoped>
#chart__container {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.sticky {
  position: sticky;
  top: 0;
  width: 100%;
  height: 50%;
  min-height: 0;
  overflow: hidden;
}

.text {
  position: absolute;
  top: 50%;
  left: 50%;
  box-sizing: border-box;
  width: min(960px, 100%);
  padding: 0 24px;
  transform: translate(-50%, -50%);
  text-align: center;
  text-shadow: 0 2px 16px rgb(0 0 0 / 72%);
  pointer-events: none;
}

.title {
  margin: 0;
  font-size: clamp(30px, 4.5vw, 54px);
  line-height: 1.1;
}

.desc {
  margin: 20px auto 0;
  max-width: 820px;
  font-size: clamp(14px, 1.7vw, 22px);
  line-height: 1.6;
}

.floor-container {
  position: relative;
  width: 100%;
  height: 200%;
  min-height: 0;
  color: #fff;
  background-color: #000;
}

@media (max-width: 720px) {
  .desc {
    margin-top: 14px;
  }
}
</style>
```

## 代码分析

**需要用到的工具：**

1. Globe.gl: 基于 Three.js 的封装，将复杂的 WebGL 地球渲染简化为数据驱动的API组合。
2. GSAP 与 ScrollTrigger：把文案浮现进度绑定到演示区域自身的滚动条。

**核心代码分析：**

1. 这里选择 Globe.gl 的原因是其拥有强大的**数据映射能力**, 可以轻松的将地理坐标 (GPS) 轻松转换为 3D 空间坐标

```js
  .labelsData(initData)
  .labelLat(d => d.value[1])
  .labelLng(d => d.value[0])
```

2. 这里利用 setInterval 配合 requestIdleCallback，动态调整标签大小 (labelSize)，增加“呼吸感”。

```js
highlightTimer = window.setInterval(() => {
  const scheduleIdle = window.requestIdleCallback ?? ((callback) => window.setTimeout(callback, 1))
  scheduleIdle(() => {
    highlightIndex.value = (highlightIndex.value + 1) % initData.length
    world.labelsData([...initData])
  })
}, 2000)
```

3. 这里使用 GSAP 让文案随着预览区域内部滚动平滑浮现。

```js
const scrollContainer = containerRef.value?.closest('.demo-stage')

introTween = gsap.fromTo(
  textRef.value,
  { y: 64, opacity: 0 },
  {
    y: 0,
    opacity: 0.84,
    ease: 'none',
    scrollTrigger: {
      trigger: containerRef.value,
      scroller: scrollContainer ?? undefined,
      start: 'top top',
      end: '+=45%',
      scrub: 1,
    },
  },
)
```

4. 销毁高亮定时器、ResizeObserver、GSAP 动画和地球实例，避免组件卸载后继续占用资源。

```js
onBeforeUnmount(() => {
  if (highlightTimer !== null) window.clearInterval(highlightTimer)
  resizeObserver?.disconnect()
  introTween?.kill()
  world?._destructor?.()
})
```

## 写在最后

以上就是使用 globe.gl 创建 3D 交互式动画的全部内容了，其实相对比较简单，大多数都是 API 的配置，后期如果有时间，研究一下出个2.0版本，可以在坐标的位置添加对应的图片，点击图片放大。或者增加国家地区的选择，可以让用户自定义选择国家地区，增加功能交互。

最后不得不说，骗你 “一键三连” 真难，还得编故事，哈哈哈...
