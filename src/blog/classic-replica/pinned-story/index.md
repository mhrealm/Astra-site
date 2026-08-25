---
title: "如何使用GSAP实现一个 `pinned` 滚动楼层叙事？"
description: "最近在做的一个动画，特意去网上查了一下叫 pinned 滚动叙事，感觉蛮有趣，分享给你们。"
pubDate: "2026-08-10"
category: "经典复刻"
categorySlug: "classic-replica"
tags: ["GSAP"]
difficulty: 5
source: "vue-practice/src/views/classic-replica/pinned-story/index.md"
---
## 准备工作

技术栈： vue + gsap

最近在做的一个动画，特意去网上查了一下叫 pinned 滚动叙事，感觉蛮有趣，分享给你们。

大致的动画如下：
【动态图】

对应的网址是：https://www.vaporesso.com/series-product/xros-series/xros6

## 思考过程🤔

多滚动几次上面的动画，感官上大致可以得出一个粗浅的感受。

页面滚到某一段时，画面突然停住了。你继续滚动，页面没有向下走，而是像一条时间线一样开始播放：卡片移动到中心、放大、图片和文字拉开距离，然后卡片退场，背后的内容一层一层覆盖进来。等这一段讲完，卡片又回到原位，下一个卡片接着进入页面中心，重复类似上一个卡片的动作。

从上面的动画中可以看出，实际上页面一直是固定在屏幕中间的，只是通过鼠标滚动，控制 GSAP 时间轴的播放进度。相信这对于了解GSAP的同学一定很熟悉。

既然大致的思路有了，接下来就是如何去构建页面结构了。

#### 第一步：拆解DOM

根据上面的已知了解，我们可以将上面的动作拆分成两部分，第一部分是**卡片**，第二部分是**详情内容面板**

所以你大致可以得出这样的DOM

```vue
<template>
  <div class="container">
    <!-- 固定在屏幕中的舞台 -->
    <div class="story-stage">
      <!-- 第一层：概览卡片轨道 -->
      <div class="story-card">
        <article class="story-item"></article>
        <article class="story-item"></article>
        <article class="story-item"></article>
      </div>

      <!-- 第二层：详情内容面板 -->
      <div class="story-panel">
        <section class="story-section"></section>
        <section class="story-section"></section>
        <section class="story-section"></section>
      </div>
    </div>
  </div>
</template>
```

这一步是确定层级关系：

1. container：负责撑开滚动距离。
2. story-stage：固定在视口中的舞台。
3. story-card：三张卡片组成的轨道，后面会整体移动。
4. story-panel：详情内容的叠放容器。
5. story-section：每一个需要淡入淡出的详情楼层。

#### 第二步：确定布局关系

既然DOM已经有了，接下来就是确定布局关系了，在第一步将DOM拆分成了卡片轨道、详情面板、固定舞台，这样就可以写出简化的css了。

```css
.container {
  position: relative;
  height: 1200vh;
}

.story-stage {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
}

.story-card,
.story-panel {
  position: absolute;
  inset: 0;
}

.story-card {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  align-items: center;
}

.story-section {
  position: absolute;
  inset: 0;
  opacity: 0;
  visibility: hidden;
}
```

这样一来，页面滚动时，真正被滚动条推进的是 container 的高度，而用户看到的画面始终停留在 story-stage 这一屏里。

后面的动画，其实都是在这一屏固定舞台里做状态切换。

#### 第三步：准备数据结构

布局确定之后，就可以考虑数据结构了。

因为一张卡片对应一组详情内容，所以这里不适合把 DOM 写死。更好的方式是用一份 `storyGroups` 数据同时生成卡片和详情 section。

```js
const storyGroups= [
  {
    id: 'signal',
    kicker: 'Insight Layer',
    title: '城市信号',
    description: '从街区、交通和实时事件中提炼趋势。',
    accent: '#35b7a8',
    cardImage:
      'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80',
    panels: [
      {
        id: 'map',
        kicker: 'Live Map',
        title: '街区热度被压缩到一屏',
        description: '用叠层图像表达空间变化，滚动只改变当前楼层透明度，不产生普通页面楼层。',
        image:
          'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1600&q=80',
        stats: [
          { value: '12', label: '重点街区' },
          { value: '4.8x', label: '峰值变化' },
        ],
      },
      {
        id: 'motion',
        kicker: 'Video',
        title: '视频楼层进入时重新播放',
        description: '当前视频只在对应内容完全进入时播放，离开或被下一层覆盖后立即暂停。',
        image:
          'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80',
        video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      },
      {
        id: 'brief',
        kicker: 'Decision',
        title: '最后收束成行动摘要',
        description: '同一组内容播放完成后，卡片回到初始位置，为下一组叙事让出节奏。',
        image:
          'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80',
        stats: [
          { value: '82%', label: '信号命中' },
          { value: '18m', label: '刷新周期' },
        ],
      },
    ],
  },
  {
    id: 'craft',
    kicker: 'Product Layer',
    title: '产品工艺',
    description: '把材质、结构和细节拆成连续镜头。',
    accent: '#e86d5b',
    cardImage:
      'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80',
    panels: [
      {
        id: 'material',
        kicker: 'Material',
        title: '材质镜头先占据全屏',
        description: '图片楼层绝对定位在 pinned 容器中，前后内容通过 scrub 时间轴交叉淡入淡出。',
        image:
          'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80',
        stats: [
          { value: '0.6mm', label: '边缘精度' },
          { value: '32', label: '工艺步骤' },
        ],
      },
      {
        id: 'assembly',
        kicker: 'Assembly',
        title: '结构细节在原屏内切换',
        description: '不是跳转，不是锚点，也不是后续普通楼层，而是同一个 timeline 的连续片段。',
        image:
          'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80',
      },
      {
        id: 'quality',
        kicker: 'Quality',
        title: '质检数据随后覆盖进来',
        description: '每组内容结束后，概览卡片重新出现、缩小并恢复横排状态。',
        image:
          'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1600&q=80',
        stats: [
          { value: '99.2%', label: '通过率' },
          { value: '7', label: '关键检测' },
        ],
      },
    ],
  },
  {
    id: 'future',
    kicker: 'Experience Layer',
    title: '未来体验',
    description: '用滚动串联场景、情绪和最终状态。',
    accent: '#d2a63f',
    cardImage:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    panels: [
      {
        id: 'scene',
        kicker: 'Scene',
        title: '第一幕建立场景关系',
        description: '卡片进入中心后放大，内部图像上移、文案下移，再把舞台交给内容楼层。',
        image:
          'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80',
      },
      {
        id: 'loop',
        kicker: 'Video',
        title: '动态片段承接情绪峰值',
        description: '视频显示时从头开始，继续滚动离开后暂停，回滚进入也会重新对齐播放状态。',
        image:
          'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80',
        video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      },
      {
        id: 'finish',
        kicker: 'Final',
        title: '最后回到完整概览',
        description: '第三组结束后粘性定位结束，页面才继续向下滚动。',
        image:
          'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1600&q=80',
        stats: [
          { value: '3', label: '概览卡片' },
          { value: '9', label: '叠层内容' },
        ],
      },
    ],
  },
]

```

这样做的好处是，动画流程只需要写一套。后面如果要增加第四张卡片，只需要继续往数组里加数据。

#### 第四步：计算轨道移动距离

这里有一个关键点：我需要移动的是整条卡片轨道，而不是单独移动某一张卡片。

所以当某张卡片要进入中心时，本质上是计算：

整条轨道需要移动多少，才能让当前卡片的中心点和舞台中心点重合。

```js
const getMoveX = targetCard => () => {
  const stageRect = stageRef.value.getBoundingClientRect()
  const cardRect = targetCard.getBoundingClientRect()
  const stageCenter = stageRect.left + stageRect.width / 2
  const cardCenter = cardRect.left + cardRect.width / 2
  return stageCenter - cardCenter
}
```

轨道需要移动的距离 = 舞台中心点 - 当前卡片中心点

如果结果是负数，说明卡片在舞台中心右侧，轨道需要往左移动；如果结果是正数，说明卡片在舞台中心左侧，轨道需要往右移动。

#### 第五步：编排卡片动画

有了轨道移动距离之后，就可以开始编排单张卡片的动画了。

每一张卡片的动画都可以看成同一套流程：

1. 找到当前卡片；
2. 找到除当前卡片外的其他卡片；
3. 移动整条轨道，让当前卡片进入中心；
4. 其他卡片淡出；
5. 当前卡片放大并淡出；
6. 图片上移，文案下移；
7. 整条轨道淡出，交给后面的详情 section。

```js
const addCardSequence = (timeline, group) => {
  const cardNodes = getCardNodes(group.id)
  if (!cardNodes) return

  const { card, image, copy } = cardNodes
  const cards = cardRef.value
  const cardTrack = cardTrackRef.value
  if (!cardTrack) return

  const otherCards = cards.filter(item => item !== card)
  const currentPanels = getPanelsByGroupId(group.id)

  // 第一段：轨道整体移动到目标卡片居中，然后卡片放大淡出，交给详情面板。
  timeline
    .set(cards, { zIndex: 1 })
    .set(card, { zIndex: 3 })
    .set(cardTrack, { autoAlpha: 1 })
    .to(cardTrack, { x: getMoveX(card), duration: 0.85 })
    .to(otherCards, { opacity: 0, scale: 0.94, filter: 'saturate(0.55)', duration: 0.38 }, '<+=0.12')
    .to(card, { opacity: 0, scale: 4, duration: 0.72 }, '<+=0.18')
    .to(image, { y: -54, scale: 1.06, duration: 0.72 }, '<')
    .to(copy, { y: 58, opacity: 0, duration: 0.58 }, '<')
    .to(cardTrack, { autoAlpha: 0, duration: 0.28 }, '<+=0.35')

  // 中间的内容
  addPanelSequence(timeline, currentPanels, '<+=0.18')

  // 第二段：详情面板结束后，先恢复当前卡片尺寸，再把整条轨道移回初始位置。
  timeline
    .to(cardTrack, { autoAlpha: 1, duration: 0.28 }, '>')
    .to(card, { opacity: 1, scale: 1, duration: 0.75 }, '<')
    .to(image, { y: 0, scale: 1, duration: 0.75 }, '<')
    .to(copy, { y: 0, opacity: 1, duration: 0.65 }, '<')
    .to(cardTrack, { x: 0, duration: 0.75 }, '>')
    .to(otherCards, { opacity: 1, scale: 1, filter: 'saturate(1)', duration: 0.7 }, '<+=0.12')
    .set(card, { zIndex: 1 })
}
```

这里卡片使用的是 opacity，而不是 autoAlpha。

因为 autoAlpha 会额外控制 visibility，在反向滚动时可能会让后面的卡片残留隐藏状态。单个卡片只需要透明度变化，用 opacity 更合适。

#### 第六步：处理详情 section 切换

卡片退场后，背后的详情内容开始依次出现。

每个 section 的逻辑都一样：淡入、停留、淡出。

```js
const addPanelSequence = (timeline, panels) => {
  panels.forEach((panel, index) => {
    const previousPanel = panels[index - 1]

    if (previousPanel) {
      timeline.to(previousPanel, { autoAlpha: 0, duration: 0.45 }, '>')
    }

    timeline
      .to(panel, { autoAlpha: 1, duration: 0.55 }, previousPanel ? '<' : '>')
      .to({}, { duration: 0.75 })
  })
}
```

这里的 .to({}, { duration: 0.75 }) 是一个空动画。

它不改变任何 DOM，只是占用时间线长度。因为动画被滚动控制，所以它的作用就是给当前 section 留出阅读时间。

#### 第七步：卡片恢复和轨道归位

详情内容播放完成后，不能直接把卡片重置回原始状态。

更自然的顺序应该是：先让当前卡片缩回原始大小，再让整条轨道回到初始位置。

```js
timeline
  .to(cardTrack, { autoAlpha: 1, duration: 0.28 }, '>')
  .to(card, { opacity: 1, scale: 1, duration: 0.75 }, '<')
  .to(image, { y: 0, scale: 1 }, '<')
  .to(copy, { y: 0, opacity: 1 }, '<')
  .to(cardTrack, { x: 0, duration: 0.75 }, '>')
  .to(otherCards, { opacity: 1, scale: 1, filter: 'saturate(1)' }, '<+=0.12')
```

这样用户能看到卡片从详情状态重新收回到概览状态，过渡会更完整。

#### 第八步：绑定 ScrollTrigger

最后，把整条 timeline 交给 ScrollTrigger 控制。

```js
const timeline = gsap.timeline({
  defaults: { ease: 'power2.inOut' },
  scrollTrigger: {
    trigger: containerRef.value,
    start: 'top top',
    end: 'bottom bottom',
    scrub: 1,
    invalidateOnRefresh: true,
  },
})
```

scrub: 1 表示滚动进度和动画进度绑定，并带一点缓冲。
invalidateOnRefresh: true 很重要，因为轨道移动距离是动态计算的，窗口尺寸变化后需要重新计算。

#### 第九步：处理视频播放

如果详情 section 里只有图片，动画切换到这里基本就结束了。但如果某个 section 里放了视频，还需要额外处理播放状态。

原因很简单：视频不会因为它所在的 section 透明度变成 0 就自动暂停。如果不处理，可能会出现两个问题：

1. section 已经淡出了，但视频还在后台继续播放；
2. 用户反向滚动回来时，视频不是从头开始，而是从中间继续播放。

所以这里需要根据当前可见的 section，动态控制视频播放。

先定义一个变量记录当前正在播放的视频：

```js
let activeVideo = null
```

然后封装一个从头播放视频的方法：

```js
const playFromStart = video => {
  try {
    video.currentTime = 0
    video.play().catch(() => undefined)
  } catch {
    video.play().catch(() => undefined)
  }
}
```

这里用了 `try...catch` 和 `.catch()`，是因为浏览器对自动播放有策略限制。虽然视频已经设置了 `muted` 和 `playsinline`，但 `video.play()` 仍然可能失败，所以这里做一个兜底，不让播放失败影响主动画。

接着封装暂停所有视频的方法：

```js
const pauseAllVideos = () => {
  activeVideo = null

  containerRef.value?.querySelectorAll('video').forEach(video => {
    video.pause()
  })
}
```

然后在初始化动画时，先找到所有视频，以及它们所在的 section：

```js
const videos = Array.from(containerRef.value.querySelectorAll('video'))

const videoPanels = videos
  .map(video => ({
    video,
    panel: video.closest('.story-section'),
  }))
  .filter(item => item.panel)
```

有了这个映射关系之后，就可以在 timeline 更新时判断当前该播放哪个视频：

```js
const syncVideos = () => {
  const visibleVideo =
    videoPanels.find(({ panel }) => Number(gsap.getProperty(panel, 'opacity')) > 0.65)
      ?.video ?? null

  videos.forEach(video => {
    if (video !== visibleVideo) {
      video.pause()
    }
  })

  if (!visibleVideo || activeVideo === visibleVideo) {
    if (!visibleVideo) activeVideo = null
    return
  }

  activeVideo = visibleVideo
  playFromStart(visibleVideo)
}
```

这里的判断逻辑是：

- 如果某个 section 的透明度大于 `0.65`，就认为它已经进入可见状态；
- 如果这个 section 里有视频，就把它作为当前视频；
- 其他视频全部暂停；
- 如果当前视频已经在播放，就不要重复 `currentTime = 0`，否则滚动过程中视频会一直被重置。

最后，把 `syncVideos` 挂到 timeline 的 `onUpdate` 上：

```js
const timeline = gsap.timeline({
  defaults: { ease: 'power2.inOut' },
  onUpdate: syncVideos,
  scrollTrigger: {
    trigger: containerRef.value,
    start: 'top top',
    end: 'bottom bottom',
    scrub: 1,
    invalidateOnRefresh: true,
    onLeave: pauseAllVideos,
    onLeaveBack: pauseAllVideos,
  },
})
```

这里的 `onLeave` 和 `onLeaveBack` 只做一件事：离开当前滚动动画区域时，暂停所有视频。

这样处理之后，视频就和 section 的显示状态绑定起来了。section 出现，视频从头播放；section 离开，视频暂停。

#### 第十步：组件卸载时清理动画

最后一步是清理。

在 Vue 单页应用里，页面切换时组件会卸载。如果不清理 ScrollTrigger 和 GSAP 动画，下一次再进入页面时，可能会出现多个时间线同时存在、滚动触发重复、动画状态错乱等问题。

所以这里使用 `gsap.context()` 来管理当前组件里的动画：

```js
let animationContext = null

onMounted(async () => {
  await nextTick()

  if (!isReady()) {
    return
  }

  animationContext = gsap.context(() => {
    // 初始化状态
    gsap.set(cardTrackRef.value, { autoAlpha: 1, x: 0 })
    gsap.set(cardRef.value, {
      opacity: 1,
      scale: 1,
      transformOrigin: 'center center',
    })
    gsap.set(panelRef.value, { autoAlpha: 0 })

    // 创建 timeline
    const timeline = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      onUpdate: syncVideos,
      scrollTrigger: {
        trigger: containerRef.value,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        invalidateOnRefresh: true,
        onLeave: pauseAllVideos,
        onLeaveBack: pauseAllVideos,
      },
    })

    storyGroups.forEach(group => addCardSequence(timeline, group))
    timeline.call(pauseAllVideos)
  }, containerRef.value)

  requestAnimationFrame(() => ScrollTrigger.refresh())
})
```

`gsap.context()` 的好处是，它会记录在这个回调里创建的 GSAP 动画和 ScrollTrigger。等组件卸载时，只需要调用：

```js
onBeforeUnmount(() => {
  pauseAllVideos()
  animationContext?.revert()
})
```

这里做了两件事：

1. `pauseAllVideos()`：暂停可能还在播放的视频；
2. `animationContext?.revert()`：还原当前组件中创建的动画和 ScrollTrigger。

这样页面切走后，动画不会残留。再次进入页面时，会重新创建一套干净的时间线。

## 放在最后的话

虽然上面的代码有很大一部分不是我自己写的，而是借助 AI 生成后，再一步步拆开、调试和修改出来的，但这反而让我更确定一件事：在 AI 时代，代码能力不是变得不重要了，而是换了一种更实际的存在方式。

AI 可以很快给出一个看起来能跑的结果，甚至动画效果也足够惊艳。但当你真的把它放进自己的项目里，就会遇到很多需要判断和微调的地方。

为什么滚动高度要这样设置？
为什么卡片放大淡出后，要先恢复原大小，再移动整条轨道？
为什么 `autoAlpha` 会影响反向滚动时元素是否还能出现？
为什么视频播放要跟着详情 section 的可见状态同步？
为什么一个小小的时间点调整，就会影响整段动画的丝滑程度？

这些问题，AI 可以给你一个答案，但最终负责的人还是你。你需要看懂它生成的 DOM 结构、时间线顺序、状态切换和边界处理，才知道哪里能删、哪里不能动，哪里只是“看起来复杂”，哪里其实是在保证动画的稳定和流畅。

所以我越来越觉得，AI 并不是让我们不用写代码，而是把“写代码”的重心往前推了一层：从逐行敲实现，变成理解结构、验证逻辑、发现问题、精准微调。能不能看懂 AI 代码，决定了你能不能真正接管它；能不能微调细节，决定了这个结果能不能从 demo 变成项目里可用的东西。

关注我，一个在 AI 时代依旧认真读代码、拆代码、改代码的前端开发者。
我会持续分享前端实战、动画复刻、源码理解和 AI 辅助开发经验，希望我们都能借助 AI 跑得更快，也凭借代码基础走得更稳。
