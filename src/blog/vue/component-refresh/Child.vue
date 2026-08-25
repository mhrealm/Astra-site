<template>
  <div>
    <span>当前时间：</span>
    <span>{{ time }}</span>
  </div>
</template>

<script setup>
const time = new Date(Date.now()).toLocaleString()
</script>
