<template>
  <div class="background-shake">
    <section class="step1">
      <button type="button">Let's Get Started！</button>
      <img src="https://img.xjh.me/desktop/nature/59411146_p0.jpg" alt="step1" />
    </section>

    <section class="step2">
      <p>step2</p>
      <img src="https://img.xjh.me/desktop/acg/34844544_p0.jpg" alt="step2" />
    </section>
  </div>
</template>

<style scoped>
.background-shake {
  position: absolute;
  width: 100%;
  height: 100%;
}

.step1,
.step2 {
  width: 100%;
  aspect-ratio: 1920 / 1080;
  overflow: hidden;
}

.background-shake img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.step1 button {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: -1;
  border: 0;
  border-radius: 5px;
  background-color: rgb(0 0 0 / 50%);
  padding: 10px 20px;
  color: #fff;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  transform: translate(-50%, -50%);
}

.step2 {
  position: absolute;
  top: 0;
  left: 0;
  z-index: -1;
}
</style>

<route lang="json">
{
  "meta": {
    "title": "背景抖动",
    "category": "动画动效",
    "tag": "视觉动效",
    "difficulty": 2
  }
}
</route>
