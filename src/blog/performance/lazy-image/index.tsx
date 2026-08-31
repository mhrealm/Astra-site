import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './index.less'

interface ImageItem {
  id: number
  src: string
  requested: boolean
  loaded: boolean
}

const createImageItems = (count = 48): ImageItem[] =>
  Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    src: `https://robohash.org/react-lazy-${index + 1}.png?set=set2&size=420x420`,
    requested: false,
    loaded: false,
  }))

export default function ReactLazyImageDemo() {
  const [items, setItems] = useState(() => createImageItems())
  const loadedCount = useMemo(() => items.filter((item) => item.loaded).length, [items])
  const observerRef = useRef<IntersectionObserver | null>(null)

  const requestImage = useCallback((id: number) => {
    setItems((currentItems) =>
      currentItems.map((item) => (item.id === id ? { ...item, requested: true } : item)),
    )
  }, [])

  const markLoaded = useCallback((id: number) => {
    setItems((currentItems) =>
      currentItems.map((item) => (item.id === id ? { ...item, loaded: true } : item)),
    )
  }, [])

  const observeImage = useCallback((node: HTMLImageElement | null) => {
    if (!node || node.dataset.requested === 'true' || !observerRef.current) {
      return
    }

    observerRef.current.observe(node)
  }, [])

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const image = entry.target

          if (!entry.isIntersecting || !(image instanceof HTMLImageElement)) {
            return
          }

          requestImage(Number(image.dataset.id))
          observerRef.current?.unobserve(image)
        })
      },
      {
        rootMargin: '0px 0px 180px 0px',
        threshold: 0.01,
      },
    )

    document
      .querySelectorAll<HTMLImageElement>('.lazy-image-demo img[data-requested="false"]')
      .forEach((image) => observerRef.current?.observe(image))

    return () => {
      observerRef.current?.disconnect()
      observerRef.current = null
    }
  }, [requestImage])

  return (
    <section className="lazy-image-demo">
      <header className="lazy-demo-header">
        <div>
          <p>React Demo</p>
          <h2>IntersectionObserver 图片懒加载</h2>
        </div>
        <span>
          已加载 {loadedCount} / {items.length}
        </span>
      </header>

      <div className="lazy-image-grid">
        {items.map((item) => (
          <figure className={item.loaded ? 'image-card is-loaded' : 'image-card'} key={item.id}>
            <div className="image-placeholder" aria-hidden="true" />
            <img
              ref={observeImage}
              data-id={item.id}
              data-requested={item.requested}
              src={item.requested ? item.src : undefined}
              alt={`懒加载机器人 ${item.id}`}
              onLoad={() => markLoaded(item.id)}
            />
            <figcaption>#{item.id.toString().padStart(2, '0')}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
