<template>
  <div
    ref="containerRef"
    class="container"
    :style="{ '--story-scroll-distance': storyScrollDistance }"
  >
    <div class="story-stage" ref="stageRef">
      <!-- 概览卡片轨道 -->
      <div class="story-card" ref="cardTrackRef">
        <article
          ref="cardRef"
          class="story-item"
          v-for="group in storyGroups"
          :key="group.id"
          :data-card-id="group.id"
        >
          <figure class="story-img">
            <img :src="group.cardImage" :alt="group.title" loading="lazy" />
          </figure>
          <div class="story-copy">
            <p>{{ group.kicker }}</p>
            <h2>{{ group.title }}</h2>
            <span>{{ group.description }}</span>
          </div>
        </article>
      </div>
      <!-- 详情内容面板 -->
      <div class="story-panel">
        <template v-for="group in storyGroups" :key="`${group.id}-panels`">
          <section
            ref="panelRef"
            v-for="panel in group.panels"
            :key="`${group.id}-${panel.id}`"
            class="story-section"
            :style="{ '--panel-accent': group.accent }"
            :data-card-id="group.id"
          >
            <div class="panel-visual">
              <video
                v-if="panel.video"
                :src="panel.video"
                :poster="panel.image"
                muted
                playsinline
                preload="metadata"
              ></video>
              <img v-else :src="panel.image" :alt="panel.title" loading="lazy" />
            </div>
            <div class="panel-content">
              <p class="panel-kicker">{{ group.title }} / {{ panel.kicker }}</p>
              <h2>{{ panel.title }}</h2>
              <p>{{ panel.description }}</p>
              <ul v-if="panel.stats" class="panel-stats">
                <li v-for="stat in panel.stats" :key="stat.label">
                  <strong>{{ stat.value }}</strong>
                  <span>{{ stat.label }}</span>
                </li>
              </ul>
            </div>
          </section>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, nextTick, onBeforeUnmount } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { storyGroups, storyScrollDistance } from './story-data'

gsap.registerPlugin(ScrollTrigger)

const cardRef = ref([])
const panelRef = ref([])
const containerRef = ref()
const cardTrackRef = ref()
const stageRef = ref()

// 保存 GSAP context，组件卸载时统一清理动画和 ScrollTrigger。
let animationContext = null
// 记录当前正在播放的视频，避免滚动更新时反复从头播放。
let activeVideo = null

const isReady = () =>
  containerRef.value &&
  stageRef.value &&
  cardTrackRef.value &&
  cardRef.value.length &&
  panelRef.value.length

const getCardByGroupId = (groupId) => cardRef.value.find((card) => card.dataset.cardId === groupId)

const getPanelsByGroupId = (groupId) =>
  panelRef.value.filter((panel) => panel.dataset.cardId === groupId)

const getCardNodes = (groupId) => {
  const card = getCardByGroupId(groupId)
  if (!card) return null

  const image = card.querySelector('.story-img')
  const copy = card.querySelector('.story-copy')
  return image && copy ? { card, image, copy } : null
}

// 计算整条轨道需要移动的距离，让目标卡片对齐舞台中心。
const getMoveX = (targetCard) => () => {
  const stage = stageRef.value
  if (!stage) return 0
  const stageRect = stage.getBoundingClientRect()
  const cardRect = targetCard.getBoundingClientRect()
  const stageCenter = stageRect.left + stageRect.width / 2
  const cardCenter = cardRect.left + cardRect.width / 2
  return stageCenter - cardCenter
}

const playFromStart = (video) => {
  try {
    video.currentTime = 0
    video.play().catch(() => undefined)
  } catch {
    video.play().catch(() => undefined)
  }
}

// 离开滚动区域或组件卸载时暂停所有视频，避免后台继续播放。
const pauseAllVideos = () => {
  activeVideo = null
  containerRef.value?.querySelectorAll('video').forEach((video) => {
    video.pause()
  })
}

// 把同一组里的多个 section 串成连续的淡入、停留、淡出片段。
const addPanelSequence = (timeline, panels, firstPanelPosition = '>') => {
  if (!panels.length) return

  panels.forEach((panel, index) => {
    const previousPanel = panels[index - 1]
    if (previousPanel) timeline.to(previousPanel, { autoAlpha: 0, duration: 0.45 }, '>')

    timeline
      .to(panel, { autoAlpha: 1, duration: 0.55 }, previousPanel ? '<' : firstPanelPosition)
      .to({}, { duration: 0.75 })
  })

  const lastPanel = panels.at(-1)
  if (lastPanel) {
    timeline.to(lastPanel, { autoAlpha: 0, duration: 0.45 }, '>')
  }
}

const addCardSequence = (timeline, group) => {
  const cardNodes = getCardNodes(group.id)
  if (!cardNodes) return

  const { card, image, copy } = cardNodes
  const cards = cardRef.value
  const cardTrack = cardTrackRef.value
  if (!cardTrack) return

  const otherCards = cards.filter((item) => item !== card)
  const currentPanels = getPanelsByGroupId(group.id)

  // 第一段：轨道整体移动到目标卡片居中，然后卡片放大淡出，交给详情面板。
  timeline
    .set(cards, { zIndex: 1 })
    .set(card, { zIndex: 3 })
    .set(cardTrack, { autoAlpha: 1 })
    .to(cardTrack, { x: getMoveX(card), duration: 0.85 })
    .to(
      otherCards,
      { opacity: 0, scale: 0.94, filter: 'saturate(0.55)', duration: 0.38 },
      '<+=0.12',
    )
    .to(card, { opacity: 0, scale: 4, duration: 0.72 }, '<+=0.18')
    .to(image, { y: -54, scale: 1.06, duration: 0.72 }, '<')
    .to(copy, { y: 58, opacity: 0, duration: 0.58 }, '<')
    .to(cardTrack, { autoAlpha: 0, duration: 0.28 }, '<+=0.35')

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

onMounted(async () => {
  await nextTick()
  if (!isReady()) {
    return
  }

  const scrollContainer = containerRef.value.closest('.demo-stage')

  animationContext = gsap.context(() => {
    const videos = Array.from(containerRef.value.querySelectorAll('video'))
    const videoPanels = videos
      .map((video) => ({ video, panel: video.closest('.story-section') }))
      .filter((item) => item.panel)

    // 根据当前可见的 section 同步视频，只播放正在展示的那一个。
    const syncVideos = () => {
      const visibleVideo =
        videoPanels.find(({ panel }) => Number(gsap.getProperty(panel, 'opacity')) > 0.65)?.video ??
        null

      videos.forEach((video) => {
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

    gsap.set(cardTrackRef.value, { autoAlpha: 1, x: 0 })
    gsap.set(cardRef.value, { opacity: 1, scale: 1, transformOrigin: 'center center' })
    gsap.set(panelRef.value, { autoAlpha: 0 })

    // 用一个 scrub 时间线承载全部片段，让滚动进度驱动叙事节奏。
    const timeline = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      onUpdate: syncVideos,
      scrollTrigger: {
        trigger: containerRef.value,
        scroller: scrollContainer ?? undefined,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        invalidateOnRefresh: true,
        onLeave: pauseAllVideos,
        onLeaveBack: pauseAllVideos,
      },
    })
    storyGroups.forEach((group) => addCardSequence(timeline, group))
    timeline.call(pauseAllVideos)
  }, containerRef.value)

  requestAnimationFrame(() => ScrollTrigger.refresh())
})

onBeforeUnmount(() => {
  pauseAllVideos()
  animationContext?.revert()
})
</script>

<style scoped>
.container {
  position: relative;
  height: calc(100vh - 60px + var(--story-scroll-distance, 1440vh));
  background-color: #191b1f;
  color: #fff;
}

.container video,
.container img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.story-stage {
  position: sticky;
  top: 0;
  height: calc(100vh - 60px);
  overflow: hidden;
  isolation: isolate;
  background:
    linear-gradient(120deg, rgba(53, 183, 168, 0.14), transparent 30%),
    linear-gradient(250deg, rgba(232, 109, 91, 0.16), transparent 34%), #101214;
  display: flex;
  justify-content: center;
  align-items: center;
}

.story-card {
  --story-card-gap: 1.8rem;
  --story-card-width: 90vw;

  position: relative;
  z-index: 4;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: center;
  gap: var(--story-card-gap);
  width: var(--story-card-width);
  will-change: transform, opacity;
}

.story-item {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 68rem;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 0.8rem;
  background: #191b1f;
  box-shadow: 0 2.4rem 7rem rgba(0, 0, 0, 0.26);
  transform-origin: center center;
  will-change: transform, opacity;
  overflow: hidden;
}

.story-img {
  width: 100%;
  height: 64%;
  will-change: transform;
}

.story-copy {
  margin: 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  will-change: transform, opacity;
}

.story-copy h2 {
  font-size: 3.8rem;
  line-height: 1.12;
}

.story-copy p {
  font-size: 1.6rem;
  font-weight: 700;
  line-height: 1.35;
  text-transform: uppercase;
}

.story-copy span {
  color: rgba(255, 255, 255, 0.72);
  font-size: 1.9rem;
  line-height: 1.5;
}

.story-panel {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
}

.story-section {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: 69rem 54rem;
  gap: 5rem;
  align-items: center;
  padding: 7rem 32rem;
  opacity: 0;
  visibility: hidden;
}

.story-section .panel-visual {
  height: min(66vh, 62rem);
  overflow: hidden;
  border-radius: 0.8rem;
  background: #0b0d10;
  box-shadow: 0 2.8rem 8rem rgba(0, 0, 0, 0.32);
}

.story-section .panel-content::before {
  display: block;
  width: 7rem;
  height: 0.5rem;
  border-radius: 0.5rem;
  background: var(--panel-accent);
  content: '';
}

.story-section .panel-content {
  max-width: 54rem;
  display: flex;
  flex-direction: column;
  gap: 2.6rem;
}

.panel-content .panel-kicker {
  color: var(--panel-accent);
  font-size: 1.6rem;
  font-weight: 700;
  line-height: 1.35;
  text-transform: uppercase;
}

.panel-content h2 {
  font-size: 6.4rem;
  line-height: 1.08;
}

.panel-content p {
  font-size: 2rem;
  line-height: 1.6;
}

.panel-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.6rem;
  margin: 1.8rem 0 0;
  padding: 0;
  list-style: none;
}

.panel-stats li {
  min-width: 0;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.8rem;
  background: rgba(255, 255, 255, 0.07);
}

.panel-stats strong {
  display: block;
  font-size: 3.2rem;
  line-height: 1.2;
  letter-spacing: 0;
}

.panel-stats span {
  display: block;
  margin-top: 0.6rem;
  font-size: 1.5rem;
  line-height: 1.4;
  color: rgba(248, 242, 232, 0.64);
}

@media (max-width: 1023px), (orientation: portrait) {
  .story-stage {
    justify-content: flex-start;
  }

  .story-card {
    --story-card-gap: 1.2rem;

    display: flex;
    padding: 0 5vw;
    width: max-content;
  }

  .story-item {
    flex: 0 0 var(--story-card-width);
    height: 48rem;
  }

  .story-img {
    height: 58%;
  }

  .story-copy {
    margin: 2rem;
    gap: 1rem;
  }

  .story-copy h2 {
    font-size: 2.9rem;
  }

  .story-copy p {
    font-size: 1.35rem;
  }

  .story-copy span {
    font-size: 1.55rem;
  }

  .story-panel {
    align-items: stretch;
  }

  .story-section {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, auto) auto;
    gap: 2.2rem;
    align-content: center;
    padding: 3rem 2.4rem;
  }

  .story-section .panel-visual {
    height: min(31rem, 42vh);
    min-height: 20rem;
  }

  .story-section .panel-content {
    max-width: none;
    gap: 1.2rem;
  }

  .panel-content .panel-kicker {
    font-size: 1.25rem;
  }

  .panel-content h2 {
    font-size: 3.3rem;
  }

  .panel-content p {
    font-size: 1.55rem;
    line-height: 1.55;
  }

  .panel-stats {
    gap: 1rem;
    margin-top: 0.4rem;
  }

  .panel-stats li {
    padding: 1.2rem;
  }

  .panel-stats strong {
    font-size: 2.4rem;
  }

  .panel-stats span {
    font-size: 1.25rem;
  }
}
</style>
