import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

const blog = defineCollection({
  // Each article lives in `src/blog/<category>/<slug>/index.md(x)` with its demo files.
  loader: glob({ base: './src/blog', pattern: '**/index.{md,mdx}' }),
  // Type-check frontmatter using a schema
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      // Transform string to Date object
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      heroImage: z.optional(image()),
      category: z.string().default('未分类'),
      categorySlug: z.string().default('uncategorized'),
      tags: z.array(z.string()).default([]),
      difficulty: z.number().min(1).max(5).optional(),
      source: z.string().optional(),
      demoSlug: z.string().optional(),
      demoInline: z.boolean().default(false),
      demoComponent: z.string().default('index.vue'),
      demoSourceFiles: z.array(z.string()).optional(),
      demoTitle: z.string().optional(),
      demoDescription: z.string().optional(),
      demoVariants: z
        .array(
          z.object({
            slug: z.string().optional(),
            title: z.string().optional(),
            description: z.string().optional(),
            component: z.string().default('index.vue'),
            inline: z.boolean().default(false),
            sourceFiles: z.array(z.string()).optional(),
          }),
        )
        .default([]),
    }),
})

export const collections = { blog }
