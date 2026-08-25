import { existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import type { CollectionEntry } from 'astro:content'
import { getBlogSlug } from './blogSlugs'

// Demos are derived from colocated article and component files instead of a manual registry.
type BlogEntry = CollectionEntry<'blog'>
type DemoFramework = 'vue' | 'react'

interface DemoVariantConfig {
  slug?: string
  title?: string
  description?: string
  component?: string
  inline?: boolean
  sourceFiles?: string[]
}

export interface DemoEntry {
  slug: string
  articleSlug: string
  title: string
  description: string
  category: string
  categorySlug: string
  componentPath: string
  framework: DemoFramework
  inline: boolean
  sourceRoot: string
  sourceFiles: string[]
}

const demoComponentExtensions = new Set(['.vue', '.tsx', '.jsx'])
const defaultDemoComponents = ['index.vue', 'index.tsx', 'index.jsx']
const sourceExtensions = new Set([
  '.vue',
  '.tsx',
  '.jsx',
  '.ts',
  '.js',
  '.mjs',
  '.md',
  '.css',
  '.less',
])
const articleEntryFiles = new Set(['index.md', 'index.mdx'])

const normalizeFilePath = (filePath: string) => filePath.replaceAll('\\', '/').replace(/^\.\//, '')

const getSourceRoot = (articleSlug: string) => `src/blog/${articleSlug}`

const getAbsoluteSourceRoot = (articleSlug: string) =>
  path.resolve(process.cwd(), getSourceRoot(articleSlug))

const getDefaultDemoSlug = (articleSlug: string, componentFile: string) => {
  const articleName = path.posix.basename(articleSlug)
  const componentName = path.posix.basename(componentFile, path.posix.extname(componentFile))

  return componentName === 'index' ? articleName : `${articleName}-${componentName}`
}

const getDemoFramework = (componentFile: string): DemoFramework => {
  const extension = path.posix.extname(componentFile)

  if (extension === '.vue') {
    return 'vue'
  }

  if (extension === '.tsx' || extension === '.jsx') {
    return 'react'
  }

  throw new Error(`Unsupported demo component extension: ${componentFile}`)
}

const getDefaultComponentFile = (sourceRoot: string) =>
  defaultDemoComponents.find((componentFile) => {
    const absolutePath = path.resolve(sourceRoot, componentFile)
    return existsSync(absolutePath) && statSync(absolutePath).isFile()
  })

const createUniqueSlug = (baseSlug: string, articleSlug: string, usedSlugs: Set<string>) => {
  if (!usedSlugs.has(baseSlug)) {
    usedSlugs.add(baseSlug)
    return baseSlug
  }

  const fallbackSlug = articleSlug.replaceAll('/', '-')
  usedSlugs.add(fallbackSlug)
  return fallbackSlug
}

const isInsideSourceRoot = (sourceRoot: string, filePath: string) => {
  const absolutePath = path.resolve(sourceRoot, filePath)
  return absolutePath === sourceRoot || absolutePath.startsWith(sourceRoot + path.sep)
}

const getSourceFiles = (
  articleSlug: string,
  componentFile: string,
  configuredSourceFiles?: string[],
) => {
  const sourceRoot = getAbsoluteSourceRoot(articleSlug)
  const normalizedComponentFile = normalizeFilePath(componentFile)

  if (configuredSourceFiles) {
    const files = [normalizedComponentFile, ...configuredSourceFiles.map(normalizeFilePath)]
    return [...new Set(files)]
  }

  const files: string[] = []

  function walkDirectory(absoluteDirectory: string, relativeDirectory = '') {
    for (const entry of readdirSync(absoluteDirectory, { withFileTypes: true })) {
      const relativePath = normalizeFilePath(path.join(relativeDirectory, entry.name))
      const absolutePath = path.join(absoluteDirectory, entry.name)

      if (entry.isDirectory()) {
        walkDirectory(absolutePath, relativePath)
        continue
      }

      if (!sourceExtensions.has(path.extname(entry.name)) || articleEntryFiles.has(relativePath)) {
        continue
      }

      files.push(relativePath)
    }
  }

  if (existsSync(sourceRoot)) {
    walkDirectory(sourceRoot)
  }

  return [
    normalizedComponentFile,
    ...files.filter((filePath) => filePath !== normalizedComponentFile).sort(),
  ]
}

const createDemo = (
  post: BlogEntry,
  usedSlugs: Set<string>,
  variant?: DemoVariantConfig,
): DemoEntry | null => {
  const articleSlug = getBlogSlug(post)
  const sourceRoot = getAbsoluteSourceRoot(articleSlug)
  const configuredComponentFile =
    variant?.component ?? post.data.demoComponent ?? getDefaultComponentFile(sourceRoot)

  if (!configuredComponentFile) {
    return null
  }

  const componentFile = normalizeFilePath(configuredComponentFile)
  const componentExtension = path.posix.extname(componentFile)

  if (!isInsideSourceRoot(sourceRoot, componentFile)) {
    throw new Error(`Unexpected demo component path: ${componentFile}`)
  }

  if (!demoComponentExtensions.has(componentExtension)) {
    throw new Error(`Unsupported demo component path: ${componentFile}`)
  }

  const componentAbsolutePath = path.resolve(sourceRoot, componentFile)

  if (!existsSync(componentAbsolutePath) || !statSync(componentAbsolutePath).isFile()) {
    return null
  }

  const slug = createUniqueSlug(
    variant?.slug ?? post.data.demoSlug ?? getDefaultDemoSlug(articleSlug, componentFile),
    articleSlug,
    usedSlugs,
  )

  return {
    slug,
    articleSlug,
    title: variant?.title ?? post.data.demoTitle ?? post.data.title,
    description: variant?.description ?? post.data.demoDescription ?? post.data.description,
    category: post.data.category,
    categorySlug: post.data.categorySlug,
    componentPath: `../blog/${articleSlug}/${componentFile}`,
    framework: getDemoFramework(componentFile),
    inline: variant?.inline ?? post.data.demoInline,
    sourceRoot: getSourceRoot(articleSlug),
    sourceFiles: getSourceFiles(
      articleSlug,
      componentFile,
      variant?.sourceFiles ?? post.data.demoSourceFiles,
    ),
  }
}

export function getDemosFromPosts(posts: BlogEntry[]) {
  const usedSlugs = new Set<string>()
  const demos: DemoEntry[] = []

  for (const post of posts) {
    const mainDemo = createDemo(post, usedSlugs)

    if (mainDemo) {
      demos.push(mainDemo)
    }

    for (const variant of post.data.demoVariants) {
      const demo = createDemo(post, usedSlugs, variant)

      if (demo) {
        demos.push(demo)
      }
    }
  }

  return demos
}

export function getDemoBySlug(demos: DemoEntry[], slug?: string) {
  return demos.find((demo) => demo.slug === slug)
}

export function getDemoByArticleSlug(demos: DemoEntry[], articleSlug?: string) {
  return demos.find((demo) => demo.articleSlug === articleSlug)
}

export function getDemoForPost(post: BlogEntry) {
  return getDemosFromPosts([post])[0]
}
