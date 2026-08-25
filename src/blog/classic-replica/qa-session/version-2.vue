<template>
  <div class="version version2">
    <div v-for="(item, index) in questionList" :key="index" class="step-content" :class="[`step${index}`, currentStep === index ? 'fade-enter-done' : 'fade-item']">
      <img class="image-bg" :src="item.imgSrc" alt="" :style="{ opacity: animationStates[index]?.imageOpacity ?? 0 }" @load="handleImageLoad(index)" />
      <div v-if="index === 0" class="begin-testing" @click="handleBeginTesting"></div>
      <img v-if="item.question1" class="question question1" :src="item.question1" alt="" :style="{ opacity: animationStates[index]?.question1Opacity ?? 0 }" @click="handleAnsweringQuestion" />
      <img v-if="item.question2" class="question question2" :src="item.question2" alt="" :style="{ opacity: animationStates[index]?.question2Opacity ?? 0 }" @click="handleAnsweringQuestion" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, reactive, ref, watch } from 'vue'
import { questionList } from './question-data'

const currentStep = ref(0)
const animationStates = reactive(
  questionList.map(() => ({
    imageOpacity: 0,
    question1Opacity: 0,
    question2Opacity: 0,
    imageLoaded: false,
  })),
)

let timers: number[] = []

const clearTimers = () => {
  timers.forEach(timer => window.clearTimeout(timer))
  timers = []
}

const resetAnimation = (index: number) => {
  const state = animationStates[index]

  if (!state) {
    return
  }

  state.imageOpacity = 0
  state.question1Opacity = 0
  state.question2Opacity = 0
}

const runAnimation = (index: number) => {
  const item = questionList[index]
  const state = animationStates[index]

  if (!item || !state?.imageLoaded || currentStep.value !== index) {
    return
  }

  clearTimers()
  state.imageOpacity = 1

  if (item.question1) {
    const question1Timer = window.setTimeout(() => {
      state.question1Opacity = 1

      if (item.question2) {
        const question2Timer = window.setTimeout(() => {
          state.question2Opacity = 1
        }, 500)
        timers.push(question2Timer)
      }
    }, 500)
    timers.push(question1Timer)
  }
}

const handleImageLoad = (index: number) => {
  const state = animationStates[index]

  if (!state) {
    return
  }

  state.imageLoaded = true
  runAnimation(index)
}

const handleBeginTesting = () => {
  currentStep.value = 1
}

const handleAnsweringQuestion = () => {
  currentStep.value += 1
}

watch(currentStep, index => {
  clearTimers()
  resetAnimation(index)
  runAnimation(index)
})

onBeforeUnmount(clearTimers)
</script>

<style scoped>
.version {
  position: relative;
  display: flex;
  width: 100%;
  min-height: 100vh;
  justify-content: center;
  overflow: hidden;
}

.step-content {
  position: absolute;
  top: 0;
  left: 50%;
  width: 100%;
  max-width: 500px;
  transform: translateX(-50%);
}

.begin-testing {
  position: absolute;
  top: 64.5%;
  left: 50%;
  width: 63%;
  height: 95px;
  cursor: pointer;
  transform: translateX(-50%);
}

.image-bg {
  width: 100%;
  height: auto;
  transition: opacity 1s ease-in-out;
}

.question {
  position: absolute;
  z-index: 100;
  height: auto;
  cursor: pointer;
  transition: opacity 1s ease-in-out;
}

.step1 .question1 {
  top: 28%;
  right: 6%;
  width: 36%;
}

.step1 .question2 {
  top: 57%;
  right: 59%;
  width: 35%;
}

.step2 .question1 {
  top: 25%;
  right: 6%;
  width: 46%;
}

.step2 .question2 {
  top: 57%;
  right: 59%;
  width: 35%;
}

.step3 .question1 {
  top: 27%;
  right: 3%;
  width: 46%;
}

.step3 .question2 {
  top: 39%;
  right: 58%;
  width: 40%;
}

.fade-item {
  z-index: 10;
}

.fade-enter-done {
  z-index: 100;
}
</style>
