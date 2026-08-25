<template>
  <div class="version version1">
    <div v-for="(item, index) in questionList" :key="index" class="step-content" :class="[`step${index}`, currentStep !== index ? 'fade-item' : 'fade-enter-done']">
      <img class="image-bg" :src="item.imgSrc" alt="" />
      <div v-if="index === 0" class="begin-testing" @click="handleBeginTesting"></div>
      <img v-if="item.question1" class="question question1" :src="item.question1" alt="" @click="handleAnsweringQuestion" />
      <img v-if="item.question2" class="question question2" :src="item.question2" alt="" @click="handleAnsweringQuestion" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { questionList } from './question-data'

const currentStep = ref(0)

const handleBeginTesting = () => {
  currentStep.value = 1
}

const handleAnsweringQuestion = () => {
  currentStep.value += 1
}
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
  opacity: 0;
  transition: opacity 1s ease-in-out;
}

.fade-enter-done {
  z-index: 100;
  opacity: 1;
  transition: opacity 1s ease-in-out;
}
</style>
