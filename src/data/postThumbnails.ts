import type { ImageMetadata } from 'astro'

const thumbnailModules = import.meta.glob<{ default: ImageMetadata }>('../blog/**/thumb.svg', {
  eager: true,
})

export function getPostThumbnail(slug: string) {
  return thumbnailModules[`../blog/${slug}/thumb.svg`]?.default
}
