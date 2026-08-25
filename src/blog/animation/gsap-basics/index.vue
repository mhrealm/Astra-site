<template>
  <section ref="pageRef" class="gsap-basics-page">
    <div class="stage">
      <div ref="boxOneRef" class="demo-box box-one"></div>
      <div ref="boxTwoRef" class="demo-box box-two"></div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const pageRef = ref<HTMLElement | null>(null)
const boxOneRef = ref<HTMLElement | null>(null)
const boxTwoRef = ref<HTMLElement | null>(null)

let animationContext: gsap.Context | null = null

onMounted(() => {
  const page = pageRef.value
  const boxOne = boxOneRef.value
  const boxTwo = boxTwoRef.value

  if (!page || !boxOne || !boxTwo) {
    return
  }

  animationContext = gsap.context(() => {
    gsap.to(boxOne, {
      rotation: 360,
      x: 200,
      duration: 2,
      ease: 'power2.out',
    })

    gsap.to(boxTwo, {
      x: 300,
      ease: 'none',
      scrollTrigger: {
        trigger: page,
        start: 'top+=400 top',
        end: 'top+=800 top',
        scrub: true,
      },
    })
  }, page)
})

onBeforeUnmount(() => {
  animationContext?.revert()
})
</script>

<style scoped lang="less">
.gsap-basics-page {
  min-height: 300vh;
  padding: 48px;
  background: #f3f6ef;
}

.stage {
  position: relative;
  min-height: 100vh;
}

.demo-box {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  background: #2f8f46;
}

.box-one {
  margin-bottom: 120px;
}

.box-two {
  position: sticky;
  top: 20%;
}
</style>

<route lang="json">{
  "meta": {
    "title": "GSAP ScrollTrigger 基础",
    "category": "动画动效",
    "tag": "GSAP",
    "difficulty": 3
  }
}</route>
