---
title: '如何使用双缓冲优化视频切换'
description: '通过单 video 与双 video 的对比，说明切换时空档是怎么产生的，以及用双缓冲让画面不中断的实现方式。'
pubDate: '2026-11-11'
category: '性能优化'
categorySlug: 'performance'
tags: ['Video', 'Double Buffer']
difficulty: 2
demoSlug: 'video-double-buffer'
demoComponent: 'comparison.vue'
demoTitle: '单 video 与双缓冲对比'
demoDescription: '同一组切换按钮同时驱动两种实现，对照切换瞬间的画面空档。'
demoVariants:
  - slug: 'video-switch-single'
    title: '单 video：直接换 src'
    description: '切换时先清空当前 video，旧画面消失后出现加载空档。'
    component: 'single-video.vue'
  - slug: 'video-switch-double-buffer'
    title: '双 video：双缓冲'
    description: '后台加载新视频，首帧就绪后再交换显示，切换时画面不中断。'
    component: 'index.vue'
---

在轮播图、产品展示或者背景动画里切换视频时，你可能遇到过这样的情况：点击切换的一瞬间，画面黑了一下，或者卡在原地，过一会儿新视频才出现。视频本身没有问题，问题出在"切换"这个动作上。

这篇文章通过一组单 video 与双 video 的对比演示，说明这段空档是怎么产生的，并介绍一种只需要十几行代码的优化方式——双缓冲。

## 为什么切换视频会"闪"一下

轮播图、产品展示、背景动画，经常需要在同一个位置切换不同的视频。最直接的写法，是拿到 `video` 元素后直接换掉它的 `src`：

```ts
video.removeAttribute('src')
video.load()
video.src = nextSrc
video.play()
```

问题在于，这个 `video` 同时承担了两件事：**显示当前画面**和**加载下一个资源**。一旦开始加载新资源，旧画面就不再可用，而新视频还要经历下载、解码，才能出现第一帧。这段时间里，用户看到的就是黑屏、背景色，或者一个"加载中"的遮罩。

这段"旧画面已经没了，新画面还没来"的空档，就是切换时的卡顿感来源。

## 先看单 video 的写法

下面是演示中左侧的单 video 实现。为了让空档更容易观察，我们在切换时显示一个"加载中"遮罩，并在 `playing` 事件触发后移除它：

```html
<template>
  <div class="stage">
    <video ref="video" muted playsinline loop></video>
    <div v-if="loading" class="mask">加载中…</div>
  </div>
</template>

<script setup lang="ts">
const video = useTemplateRef<HTMLVideoElement>('video')
const loading = ref(false)

const play = (src: string) => {
  const el = video.value!
  el.src = src
  el.play().catch(() => {})
}

const switchClip = (index: number) => {
  loading.value = true
  // 直接清空正在显示的 video，旧画面立刻消失
  video.value!.removeAttribute('src')
  video.value!.load()
  play(clips[index].src)
}

onMounted(() => {
  video.value!.addEventListener('playing', () => (loading.value = false))
  play(clips[0].src)
})
</script>
```

这里的遮罩只是把空档"可视化"出来。就算去掉遮罩，用户看到的也是背景露出来或者画面卡住。

## 双 video：把加载和显示分开

双缓冲的思路很简单：既然一个 `video` 不能同时"显示"和"加载"，那就用两个。

- 一个 `video` 留在前台，继续显示当前画面。
- 另一个 `video` 藏在后台，专门加载新视频。
- 后台视频的**首帧就绪**后，再交换两者的显示状态。

```text
点击切换 → 前台保持不动 → 后台加载新视频 → 首帧就绪 → 播放后台、暂停前台 → 交换显示
```

整个过程中，用户看到的始终是一个有画面的 `video`，不会出现空档。

## 第一步：叠放两个 video

两个 `video` 叠在同一个容器里，用一个布尔值记录当前显示的是哪一个。

```html
<template>
  <div class="stage">
    <video ref="videoA" :class="{ show: isAVisible }" muted playsinline loop></video>
    <video ref="videoB" :class="{ show: !isAVisible }" muted playsinline loop></video>
  </div>
</template>
```

样式上，两个视频绝对定位、尺寸完全一致，没有 `show` 类的那个用 `visibility: hidden` 隐藏：

```css
.stage {
  position: relative;
  aspect-ratio: 16 / 9;
  background: #000;
}

.stage video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.stage video:not(.show) {
  visibility: hidden;
}
```

这里用 `visibility` 而不是 `v-if`，是为了让两个 `video` 元素一直存在，不会因为销毁重建而丢失状态。`muted` 和 `playsinline` 则有助于满足移动端静音内联自动播放的条件。

## 第二步：只在后台加载，首帧就绪后交换

切换的核心逻辑只有十几行：

```ts
const videoA = useTemplateRef<HTMLVideoElement>('videoA')
const videoB = useTemplateRef<HTMLVideoElement>('videoB')
// 当前显示的是 A 还是 B
const isAVisible = ref(true)

const switchClip = (clipIndex: number) => {
  const visibleVideo = isAVisible.value ? videoA.value! : videoB.value! // 正在显示的
  const standbyVideo = isAVisible.value ? videoB.value! : videoA.value! // 隐藏的后台

  // 只在后台加载，当前显示的保持不动
  standbyVideo.src = clips[clipIndex].src
  // 后台首帧就绪后：播放它、暂停当前显示的、交换显示
  standbyVideo.onloadeddata = () => {
    standbyVideo.play().catch(() => {})
    visibleVideo.pause()
    isAVisible.value = !isAVisible.value
  }
}

onMounted(() => {
  videoA.value!.src = clips[0].src
  videoA.value!.play().catch(() => {})
})
```

几个关键点：

- **`visibleVideo` / `standbyVideo` 每次点击时重新计算**。它们是相对的角色，由 `isAVisible` 决定谁是谁。
- **设置 `src` 的对象永远是后台视频**，前台视频完全不受影响，画面不会中断。
- **用 `loadeddata` 作为交换时机**。它表示当前播放位置已经有可渲染的数据，也就是首帧准备好了。相比 `loadedmetadata`（只拿到了尺寸和时长，不一定有画面），它更适合作为"可以显示了"的信号。
- **交换只是翻转一个布尔值**。`isAVisible` 变化后，两个 `video` 的 `show` 类同时切换，一个显示、一个隐藏，在同一次渲染里完成。
- **每次点击重新赋值 `onloadeddata`** 。快速连续点击时，后一次赋值会覆盖前一次的回调，所以最终只有最后一次选择会生效。

## 双 video 的优势

把单视频和双视频放在一起对比，双缓冲的好处主要有下面几点。

**1. 切换时画面不中断**

这是最直观的收益。单视频切换必然经历"旧画面消失 → 新画面出现"的空档，而双视频的前台始终保持当前画面，直到新视频的首帧准备好才交换，用户看不到黑屏或遮罩。

**2. 等待期间可以继续播放旧视频**

单视频切换时，旧视频立刻被清空。双视频在后台加载的这段时间里，前台视频仍然正常播放，等新视频就绪的瞬间才暂停，等待对用户来说几乎是无感的。

**3. 加载慢也不会让画面变空**

网络慢的时候，新视频可能要几秒才有首帧。单视频在这几秒里一直是空画面，双视频则一直显示着旧内容，体验上是"有点延迟"而不是"坏了"。

**4. 实现成本低**

整个方案只用到 Vue 的响应式和浏览器原生的 `video` 元素，不需要播放器库，不需要 Canvas 拼接，核心逻辑不到二十行，容易理解和维护。

**5. 为扩展留出空间**

在"后台加载、就绪后交换"这个骨架上，可以很自然地继续扩展：

- 把 `visibility` 换成 `opacity` 加过渡，做淡入淡出。
- 给后台视频加上 `error` 事件，加载失败时保持旧画面并提示用户。
- 在用户悬停按钮时提前加载下一个视频，进一步缩短感知延迟。

## 它不能解决什么

双缓冲优化的是"切换瞬间的体验"，使用时也要知道它的边界：

- **不会减小视频体积，也不会加快网络**。新视频该下载多久还是多久，只是这段等待不再表现为空画面。
- **首次加载依然要等**。页面第一次进入时没有旧画面可以保留，需要靠封面图（`poster`）之类的方式兜底。
- **多占一个 `video` 的资源**。两个视频元素同时存在，高分辨率视频在移动端的解码开销要留意，只保留"当前"和"下一个"两个就够了。
- **演示代码是精简版**。当前实现没有处理加载失败、没有等待 `play()` 成功再交换，旧视频在交换后也没有释放资源。如果用在生产环境，建议补上 `error` 处理，并在交换完成后清理隐藏层的 `src`。
- **不解决构图差异**。如果两段视频的画面内容和构图差别很大，即使过渡没有空档，视觉上仍然会有明显的跳变。

## 演示

演示页目前维护中，后期会展示...

## 小结

视频切换时的卡顿，本质是"一个元素既要显示旧画面、又要加载新资源"。双缓冲把这两件事拆给两个 `video`：前台负责显示，后台负责加载，首帧就绪后再交换。它不改变资源本身的加载速度，但让这段等待不再体现为空画面，用很小的代码量换来了明显更平滑的切换体验。
