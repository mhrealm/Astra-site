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
