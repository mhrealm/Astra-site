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
import { onMounted, ref, onBeforeUnmount } from 'vue'
import Globe from 'globe.gl'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import earthImg from './earth-night.jpg'
import skyImg from './night-sky.png'

gsap.registerPlugin(ScrollTrigger)
const containerRef = ref(null)
const chartRef = ref(null)
const textRef = ref(null)
const highlightIndex = ref(-1)
let world = null

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
  const width = window.innerWidth
  const height = window.innerHeight

  // 初始化地球
  world = Globe()(chartRef.value)
    .width(width) // 设置地球画布的宽度
    .height(height)
    .globeImageUrl(earthImg) // 设置地球表面的贴图
    .backgroundImageUrl(skyImg) // 设置背景图
    .atmosphereColor('#ffb4ff') // 设置地球周围“大气层”的光晕颜色
    .atmosphereAltitude(0.06) // 设置大气层的厚度
    .pointOfView({
      lat: 36.818188, // 设置相机初始化时正对着的经纬度
      lng: 12.227512,
      altitude: 2.5, // 相机距离地表的高度
    })
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
  const interval = setInterval(() => {
    const scheduleIdle =
      window.requestIdleCallback ?? ((callback) => window.setTimeout(callback, 1))
    scheduleIdle(() => {
      highlightIndex.value = (highlightIndex.value + 1) % initData.length
      world.labelsData([...initData])
    })
  }, 2000)

  // GSAP 滚动动画逻辑
  gsap.fromTo(
    textRef.value,
    { y: 100, opacity: 0, zIndex: -1 },
    {
      y: 0,
      opacity: 0.8,
      duration: 1,
      zIndex: 1,
      scrollTrigger: {
        trigger: containerRef.value,
        start: 'top top',
        end: '+=50%',
        scrub: 1,
        markers: false,
      },
    },
  )

  // 监听窗口变化
  const handleResize = () => {
    world.width(window.innerWidth)
    world.height(window.innerHeight)
  }
  window.addEventListener('resize', handleResize)

  // 清理函数
  onBeforeUnmount(() => {
    if (interval) clearInterval(interval)
    window.removeEventListener('resize', handleResize)
    if (world) world._destructor?.() // 销毁地球实例防止内存泄漏
  })
})
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
  box-sizing: border-box;
  width: min(1620px, 100%);
  padding: 0 24px;
  transform: translate(-50%, -50%);
  text-align: center;
}

.title {
  font-size: 60px;
  line-height: 1.1;
}

.desc {
  margin-top: 30px;
  font-size: 30px;
  line-height: 1.5;
}

.floor-container {
  width: 100%;
  height: 200vh;
  position: relative;
  color: #fff;
  background-color: #000;
}

@media (max-width: 720px) {
  .title {
    font-size: 40px;
  }

  .desc {
    margin-top: 18px;
    font-size: 18px;
  }
}
</style>
