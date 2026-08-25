---
title: "我决定写一个 3D 地球仪来记录下我去过的地方"
description: "前言 你想去南极吗？那里是地球最后的留白。去看那万年不化的冰川在阳光下透着幽幽的深蓝色。 你想去北极吗？站在世界的顶点，等一场美到窒息的极光。 你想去非洲萨瓦那吗？那是离赤道最近的金色草原。听万千角马奔腾而过的蹄声，感受那种野性而滚烫的生命"
pubDate: "2026-08-10"
category: "经典复刻"
categorySlug: "classic-replica"
tags: ["动效"]
difficulty: 5
source: "vue-practice/src/views/classic-replica/earth-section/index.md"
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
        <p class="desc">The flickers on this map are more than just distant auroras and waves; they are our deepest gaze upon this planet. From the golden savannas to the neon-lit streets after rain, stories are unfolding quietly in every corner of the world.</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref, onBeforeUnmount } from 'vue';
import Globe from 'globe.gl';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import earthImg from '@/images/earth-night.jpg';
import skyImg from '@/images/night-sky.png';


gsap.registerPlugin(ScrollTrigger);
const containerRef = ref(null);
const chartRef = ref(null);
const textRef = ref(null);
const highlightIndex = ref(-1);
let world = null;

const initData = [
  { name: "Antarctica", value: [0, -82.8628, 0], zIndex: 0 },
  { name: "The Arctic", value: [0, 90, 0], zIndex: 1 },
  { name: "Savanna", value: [34.8888, -2.3333, 0], zIndex: 2 },
  { name: "Amazon", value: [-62.2159, -3.4653, 0], zIndex: 3 },
  { name: "Maldives", value: [73.2207, 3.2028, 0], zIndex: 4 },
  { name: "Cliffs of Moher", value: [-9.4309, 52.9719, 0], zIndex: 5 },
  { name: "Prague", value: [14.4378, 50.0755, 0], zIndex: 6 },
  { name: "Tokyo", value: [139.6503, 35.6762, 0], zIndex: 7 }
];

onMounted(() => {
  const width = window.innerWidth;
  const height = window.innerHeight

  // 初始化地球
  world = Globe()(chartRef.value)
    .width(width) // 设置地球画布的宽度
    .height(height)
    .globeImageUrl(earthImg) // 设置地球表面的贴图
    .backgroundImageUrl(skyImg)  // 设置背景图
    .atmosphereColor("#ffb4ff") // 设置地球周围“大气层”的光晕颜色
    .atmosphereAltitude(0.06) // 设置大气层的厚度
    .pointOfView({
      lat: 36.818188, // 设置相机初始化时正对着的经纬度
      lng: 12.227512,
      altitude: 2.5, // 相机距离地表的高度
    })
    .labelsData(initData)  // 注入数据源
    .labelLat(d => d.value[1]) // 数据里的纬度在 value 数组的第 2 个位置
    .labelLng(d => d.value[0])
    .labelText(d => d.name) // 显示在地球上的文字内容
    .labelSize(d => initData.indexOf(d) === highlightIndex.value ? 2.5 : 1.6) // 文字的大小
    .labelColor(() => "rgba(255, 165, 0, 0.75)") // 文字的颜色
    .labelDotRadius(d => {
      return initData.indexOf(d) === highlightIndex.value ? 1.2 : 0.5;
    })
    .enablePointerInteraction(true); // 开启鼠标交互

  const controls = world.controls(); // 交互控制器
  controls.enableZoom = false; // 禁用缩放
  controls.enablePan = false; // 禁用平移
  controls.autoRotate = true; // 开启自动旋转
  controls.autoRotateSpeed = -1; // 设置旋转速度和方向 负值代表是逆时针

  // 自动高亮循环
  const interval = setInterval(() => {
    window.requestIdleCallback(() => {
      highlightIndex.value = (highlightIndex.value + 1) % initData.length;
      world.labelsData([...initData]);
    });
  }, 2000);

  // GSAP 滚动动画逻辑
  gsap.fromTo(textRef.value,
    { y: 100, opacity: 0, zIndex: -1 },
    {
      y: 0, opacity: 0.8, duration: 1, zIndex: 1,
      scrollTrigger: {
        trigger: containerRef.value,
        start: "top top",
        end: "+=50%",
        scrub: 1,
        markers: false
      }
    }
  );

  // 监听窗口变化
  const handleResize = () => {
    world.width(window.innerWidth);
    world.height(window.innerHeight);
  };
  window.addEventListener("resize", handleResize);

  // 清理函数
  onBeforeUnmount(() => {
    if (interval) clearInterval(interval);
    window.removeEventListener("resize", handleResize);
    if (world) world._destructor?.(); // 销毁地球实例防止内存泄漏
  });
});
</script>

<style scoped>
#chart__container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.sticky {
  position: sticky;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
}

.text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  width: 162rem;
}

.title {
  font-size: 6rem;
}

.desc {
  font-size: 3rem;
  margin-top: 3rem;
}

.floor-container {
  width: 100%;
  height: 200vh;
  position: relative;
  color: #fff;
  background-color: #000;
}
</style>
```

## 代码分析

**需要用到的工具：**

1. Globe.gl: 基于 Three.js 的封装，将复杂的 WebGL 地球渲染简化为数据驱动的API组合。
2. GSAP & ScrollTrigger：写动效的神器，这里主要负责处理文案随页面滚动的平滑视觉过渡。

**核心代码分析：**

1. 这里选择 Globe.gl 的原因是其拥有强大的**数据映射能力**, 可以轻松的将地理坐标 (GPS) 轻松转换为 3D 空间坐标

```js
  .labelsData(initData)
  .labelLat(d => d.value[1])
  .labelLng(d => d.value[0])
```

2. 这里利用 setInterval 配合 requestIdleCallback，动态调整标签大小 (labelSize)，增加“呼吸感”。

```js
  const interval = setInterval(() => {
    window.requestIdleCallback(() => {
      highlightIndex.value = (highlightIndex.value + 1) % initData.length;
      world.labelsData([...initData]);
    });
  }, 2000);
```

3. 这里引入 gsap 动画滚动控制文字浮现，增加整体趣味。

```js
  gsap.fromTo(textRef.value,
    { y: 100, opacity: 0, zIndex: -1 },
    {
      y: 0, opacity: 0.8, duration: 1, zIndex: 1,
      scrollTrigger: {
        trigger: containerRef.value,
        start: "top top",
        end: "+=50%",
        scrub: 1,
        markers: false
      }
    }
  );
```

4. 销毁定时器（interval）、解绑全局事件（resize）、销毁地球实例（world），以上这些做法都是防止内存泄露。

```js
  onBeforeUnmount(() => {
    if (interval) clearInterval(interval);
    window.removeEventListener("resize", handleResize);
    if (world) world._destructor?.();
  });
```

## 写在最后

以上就是使用 globe.gl 创建 3D 交互式动画的全部内容了，其实相对比较简单，大多数都是 API 的配置，后期如果有时间，研究一下出个2.0版本，可以在坐标的位置添加对应的图片，点击图片放大。或者增加国家地区的选择，可以让用户自定义选择国家地区，增加功能交互。

最后不得不说，骗你 “一键三连” 真难，还得编故事，哈哈哈...
