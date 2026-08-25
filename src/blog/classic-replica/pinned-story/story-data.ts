export type StoryStat = {
  value: string
  label: string
}

export type StoryPanel = {
  id: string
  kicker: string
  title: string
  description: string
  image: string
  video?: string
  stats?: StoryStat[]
}

export type StoryGroup = {
  id: string
  kicker: string
  title: string
  description: string
  accent: string
  cardImage: string
  panels: StoryPanel[]
}

export const storyGroups: StoryGroup[] = [
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

export const getStoryScrollDistanceVh = (groups: StoryGroup[] = storyGroups) => {
  const panelCount = groups.reduce((total, group) => total + group.panels.length, 0)
  return Math.max((panelCount + groups.length * 1.8) * 100, 720)
}

export const storyScrollDistance = `${getStoryScrollDistanceVh()}vh`
