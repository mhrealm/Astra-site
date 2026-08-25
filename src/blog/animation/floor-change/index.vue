<script setup>
import { onMounted, ref } from 'vue';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// 注册插件
gsap.registerPlugin(ScrollTrigger);

const mainContainer = ref(null);
const stickyRef = ref(null);

onMounted(() => {
  const item2 = document.querySelector('.item2');
  const rect = item2.getBoundingClientRect();
  // 1. 计算覆盖比例
  const scaleX = window.innerWidth / rect.width;
  const scaleY = window.innerHeight / rect.height;
  const coverScale = Math.max(scaleX, scaleY);

  // 2. 计算中心点偏移
  // 屏幕中心点 Y 坐标
  const screenCenterY = window.innerHeight / 2;
  // 元素在当前布局下相对于视口的中心点 Y 坐标
  const elementCenterY = rect.top + rect.height / 2;
  // 这里的 yOffset 就是元素需要移动多少像素才能到达屏幕中心
  const yOffset = screenCenterY - elementCenterY;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: mainContainer.value,
      start: "top top",
      end: "+=300%", // 滚动距离，决定了动画的快慢
      scrub: 1,      // 关键：将动画与滚动条绑定，1 表示平滑延迟
      pin: true,     // 固定容器
    }
  });

  tl.fromTo(".item2", { y: yOffset, scale: coverScale, zIndex: 100 }, { y: 0, scale: 1, zIndex: 1, duration: 2 }, 0);
  tl.fromTo(".item1", { x: -window.innerWidth / 2.9 }, { x: 0, duration: 2 }, 0);
  tl.fromTo(".item3", { x: window.innerWidth / 2.9 }, { x: 0, duration: 2 }, 0);
  tl.fromTo(".floor2-content-bottom", { y: window.innerHeight / 2 }, { y: 0, duration: 2 }, 0);

});
</script>

<template>
  <div class="floor-container" ref="mainContainer">
    <div class="sticky-wrapper" ref="stickyRef">
      <section class="floor1-container">
        <div class="floor1-text">
          <img src="https://www.oppo.com/content/dam/oppo/product-asset-library/reno/reno14-series/en/reno14-pro/white-grey/v1/assets/images-ai_phone-1.png.webp" alt="">
          <p class="floor-title">Reno14 Pro <span>5G</span></p>
          <p class="floor-desc">AI Flash Photography | Al Editor 2.0</p>
        </div>
        <img class="kv-bg" src="https://www.oppo.com/content/dam/oppo/product-asset-library/reno/reno14-series/en/reno14-pro/white-grey/v1/assets/images-kv-1.jpg.webp" alt="">
        <!-- <img class="kv-phone" src="https://www.oppo.com/content/dam/oppo/product-asset-library/reno/reno14-series/en/reno14-pro/white-grey/v1/assets/images-ksp-phone-s1.png" alt=""> -->
      </section>
      <section class="floor2-container">
        <ul class="floor2-content-top">
          <li class="item1 card">
            <p>AI Flash Photography</p>
            <img src="https://www.oppo.com/content/dam/oppo/product-asset-library/reno/reno14-series/en/reno14-pro/white-grey/v1/assets/images-ksp-s1-img-0.jpg" alt="">
          </li>
          <li class="item2 card">
            <p>Iridescent Mermaid Design</p>
            <img src="https://www.oppo.com/content/dam/oppo/product-asset-library/reno/reno14-series/en/reno14-pro/white-grey/v1/assets/images-ksp-s1-img-0-mo.jpg" alt="">
          </li>
          <li class="item3 card">
            <p>AI Editor 2.0</p>
            <img src="https://www.oppo.com/content/dam/oppo/product-asset-library/reno/reno14-series/en/reno14-pro/white-grey/v1/assets/images-ksp-s1-img-2.jpg" alt="">
          </li>
        </ul>
        <ul class="floor2-content-bottom">
          <li class="item4 card">
            <p>AI Gaming</p>
            <img src="https://www.oppo.com/content/dam/oppo/product-asset-library/reno/reno14-series/en/reno14-pro/white-grey/v1/assets/images-ksp-s1-img-3.jpg" alt="">
          </li>
          <li class="item5 card">
            <p>ColorOS with Google Gemini</p>
            <img src="https://www.oppo.com/content/dam/oppo/product-asset-library/reno/reno14-series/en/reno14-pro/white-grey/v1/assets/images-ksp-s1-img-4.jpg" alt="">
          </li>
          <li class="item6 card">
            <p>Mobile Intelligent Ecosystem</p>
            <img src="https://www.oppo.com/content/dam/oppo/product-asset-library/reno/reno14-series/en/reno14-pro/white-grey/v1/assets/images-ksp-s1-img-5.jpg" alt="">
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style>
html {
  --base: 1920;
  font-size: clamp(8px, calc(10 / var(--base) * 100vw), 12px);
}
</style>

<style scoped>
.floor-container {
  width: 100%;
}

.sticky-wrapper {
  position: relative;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Floor 1 样式 */
.floor1-container {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.floor1-text {
  z-index: 10;
  position: absolute;
  top: 15%;
  left: 10rem;
}

.floor1-text img {
  width: 60%;
}

.floor1-text .floor-title {
  font-size: 7rem;
  font-weight: 600;
}

.floor1-text .floor-title span {
  font-size: 3rem;
  font-weight: 400;
}

.floor1-text .floor-desc {
  font-size: 3rem;
  font-weight: 400;
}

.kv-bg {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
}

.kv-phone {
  position: relative;
  height: 80vh;
  z-index: 5;
}

/* Floor 2 样式 */
.floor2-container {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 20px;
  padding: 50px;
}

.floor2-content-top,
.floor2-content-bottom {
  display: flex;
  justify-content: center;
  gap: 20px;
  list-style: none;
}

.floor2-content-top .item2 {
  flex: 2;
}

.floor2-container p {
  position: absolute;
  bottom: 2rem;
  left: 4rem;
  font-size: 3rem;
  font-weight: 400;
}

.card {
  background: #1d1d1f;
  /* border-radius: 20px; */
  overflow: hidden;
  color: white;
  flex: 1;
  height: 40vh;
  position: relative;
}

.card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>

<route lang="json">{
  "meta": {
    "title": "楼层转场动画",
    "category": "动画动效",
    "tag": "GSAP",
    "difficulty": 4
  }
}</route>
