import type { CollectionEntry } from 'astro:content'

type BlogEntry = CollectionEntry<'blog'>

export interface CategoryDefinition {
  slug: string
  name: string
}

export interface CategorySummary {
  name: string
  slug: string
  count: number
}

export const blogCategories = [
  { slug: 'performance', name: '性能优化' },
  { slug: 'javascript', name: 'JavaScript 实战' },
  { slug: 'react', name: 'React 实战' },
  { slug: 'vue', name: 'Vue 基础' },
  { slug: 'interaction', name: '交互组件' },
  { slug: 'animation', name: '动画动效' },
  { slug: 'canvas', name: 'Canvas 实验' },
  { slug: 'css-effects', name: 'CSS 布局与效果' },
  { slug: 'classic-replica', name: '经典复刻' },
  { slug: 'uncategorized', name: '未分类' },
] satisfies CategoryDefinition[]

const categoryRank = new Map(blogCategories.map((category, index) => [category.slug, index]))
const categorySlugByName = new Map(blogCategories.map((category) => [category.name, category.slug]))

export function getCategoryName(slug = 'uncategorized') {
  return blogCategories.find((category) => category.slug === slug)?.name ?? '未分类'
}

export function getCategoryRank(slug = 'uncategorized') {
  return categoryRank.get(slug) ?? blogCategories.length
}

export function getCategorySlugByName(name = '未分类') {
  return categorySlugByName.get(name) ?? 'uncategorized'
}

export function compareCategorySlug(aSlug = 'uncategorized', bSlug = 'uncategorized') {
  const rankDiff = getCategoryRank(aSlug) - getCategoryRank(bSlug)

  if (rankDiff !== 0) {
    return rankDiff
  }

  return aSlug.localeCompare(bSlug, 'zh-CN')
}

export function sortCategorySummaries<T extends CategorySummary>(categories: T[]) {
  return [...categories].sort(
    (a, b) => compareCategorySlug(a.slug, b.slug) || a.name.localeCompare(b.name, 'zh-CN'),
  )
}

export function getCategorySummaries(posts: BlogEntry[]) {
  const categoryMap = new Map<string, CategorySummary>()

  for (const post of posts) {
    const slug = post.data.categorySlug ?? 'uncategorized'
    const current = categoryMap.get(slug)

    if (current) {
      current.count += 1
      continue
    }

    categoryMap.set(slug, {
      name: post.data.category ?? getCategoryName(slug),
      slug,
      count: 1,
    })
  }

  return sortCategorySummaries([...categoryMap.values()])
}
