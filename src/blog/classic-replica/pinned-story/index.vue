<template>
  <div ref="containerRef" class="container" :style="{ '--story-scroll-distance': storyScrollDistance }">
    <div class="story-stage" ref="stageRef">
      <!-- 概览卡片轨道 -->
      <div class="story-card" ref="cardTrackRef">
        <article ref="cardRef" class="story-item" v-for="group in storyGroups" :key="group.id" :data-card-id="group.id">
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
          <section ref="panelRef" v-for="panel in group.panels" :key="`${group.id}-${panel.id}`" class="story-section" :style="{ '--panel-accent': group.accent }" :data-card-id="group.id">
            <div class="panel-visual">
              <video v-if="panel.video" :src="panel.video" :poster="panel.image" muted playsinline preload="metadata"></video>
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
  containerRef.value && stageRef.value && cardTrackRef.value && cardRef.value.length && panelRef.value.length

const getCardByGroupId = groupId =>
  cardRef.value.find(card => card.dataset.cardId === groupId)

const getPanelsByGroupId = groupId =>
  panelRef.value.filter(panel => panel.dataset.cardId === groupId)

const getCardNodes = groupId => {
  const card = getCardByGroupId(groupId)
  if (!card) return null

  const image = card.querySelector('.story-img')
  const copy = card.querySelector('.story-copy')
  return image && copy ? { card, image, copy } : null
}

// 计算整条轨道需要移动的距离，让目标卡片对齐舞台中心。
const getMoveX = targetCard => () => {
  const stage = stageRef.value
  if (!stage) return 0
  const stageRect = stage.getBoundingClientRect()
  const cardRect = targetCard.getBoundingClientRect()
  const stageCenter = stageRect.left + stageRect.width / 2
  const cardCenter = cardRect.left + cardRect.width / 2
  return stageCenter - cardCenter
}

const playFromStart = video => {
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
  containerRef.value?.querySelectorAll('video').forEach(video => {
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

  animationContext = gsap.context(() => {
    const videos = Array.from(containerRef.value.querySelectorAll('video'))
    const videoPanels = videos
      .map(video => ({ video, panel: video.closest('.story-section') }))
      .filter(item => item.panel)

    // 根据当前可见的 section 同步视频，只播放正在展示的那一个。
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

    gsap.set(cardTrackRef.value, { autoAlpha: 1, x: 0 })
    gsap.set(cardRef.value, { opacity: 1, scale: 1, transformOrigin: 'center center' })
    gsap.set(panelRef.value, { autoAlpha: 0 })

    // 用一个 scrub 时间线承载全部片段，让滚动进度驱动叙事节奏。
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

onBeforeUnmount(() => {
  pauseAllVideos()
  animationContext?.revert()
})

</script>

<style lang="less" scoped>
.container {
  position: relative;
  height: calc(100vh + var(--story-scroll-distance, 1440vh));
  min-height: calc(640px + var(--story-scroll-distance, 1440vh));
  background-color: #191b1f;

  video,
  img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }

  .story-stage {
    position: sticky;
    top: 0;
    height: 100vh;
    min-height: 640px;
    overflow: hidden;
    isolation: isolate;
    background:
      linear-gradient(120deg, rgba(53, 183, 168, 0.14), transparent 30%),
      linear-gradient(250deg, rgba(232, 109, 91, 0.16), transparent 34%),
      #101214;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .story-card {
    position: relative;
    z-index: 4;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: center;
    gap: 18px;
    width: min(1120px, calc(100% - 56px));
    will-change: transform, opacity;
  }

  .story-item {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 440px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 8px;
    background: #191b1f;
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.26);
    color: #fff;
    transform-origin: center center;
    will-change: transform, opacity;
    overflow: hidden;

    .story-img {
      width: 100%;
      height: 64%;
      margin: 0;
      will-change: transform;
    }

    .story-copy {
      margin: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      will-change: transform, opacity;

      h2 {
        margin: 0;
      }

      p {
        font-weight: 700;
        text-transform: uppercase;
      }

      span {
        color: rgba(255, 255, 255, 0.72);
      }
    }
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
    display: grid;
    grid-template-columns: minmax(0, 1.12fr) minmax(320px, 0.88fr);
    gap: 40px;
    align-items: center;
    padding: 60px max(36px, calc((100vw - 1180px) / 2));
    opacity: 0;
    visibility: hidden;
  }

  .story-section .panel-visual {
    height: min(66vh, 620px);
    min-height: 380px;
    overflow: hidden;
    border-radius: 8px;
    background: #0b0d10;
    box-shadow: 0 28px 80px rgba(0, 0, 0, 0.32);
  }

  .story-section .panel-content::before {
    display: block;
    width: 58px;
    height: 4px;
    border-radius: 4px;
    background: var(--panel-accent);
    content: '';
  }

  .story-section .panel-content {
    max-width: 440px;
    color: #fff;
    display: flex;
    flex-direction: column;
    gap: 20px;

    .panel-kicker {
      color: var(--panel-accent);
      font-weight: 700;
      text-transform: uppercase;
    }

    h2 {
      margin: 0;
      font-size: 44px;
      line-height: 1.08;
    }

    .panel-stats {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      margin: 14px 0 0;
      padding: 0;
      list-style: none;

      li {
        min-width: 0;
        padding: 16px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.07);
      }

      strong {
        display: block;
        font-size: 24px;
        line-height: 1.2;
        letter-spacing: 0;
      }

      span {
        display: block;
        margin-top: 6px;
        font-size: 13px;
        line-height: 1.4;
        color: rgba(248, 242, 232, 0.64);
      }
    }
  }
}
</style>

<route lang="json">{
  "meta": {
    "title": "Pinned 滚动叙事楼层",
    "category": "经典复刻",
    "tag": "GSAP",
    "difficulty": 5
  }
}</route>
