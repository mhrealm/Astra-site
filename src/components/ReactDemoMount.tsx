import { useEffect, useState, type ComponentType } from 'react'
import './ReactDemoMount.less'

type DemoModule = {
  default: ComponentType
}

interface Props {
  componentPath: string
}

const loaders = {
  ...import.meta.glob('../blog/**/*.tsx'),
  ...import.meta.glob('../blog/**/*.jsx'),
} as Record<string, () => Promise<DemoModule>>

export default function ReactDemoMount({ componentPath }: Props) {
  const [CurrentDemo, setCurrentDemo] = useState<ComponentType | null>(null)

  useEffect(() => {
    let active = true
    const loadDemo = loaders[componentPath]

    if (!loadDemo) {
      setCurrentDemo(null)
      return
    }

    loadDemo().then((module) => {
      if (active) {
        setCurrentDemo(() => module.default)
      }
    })

    return () => {
      active = false
    }
  }, [componentPath])

  if (!CurrentDemo) {
    return <div className="react-demo-loading">正在加载演示...</div>
  }

  return (
    <div className="react-demo-mount">
      <CurrentDemo />
    </div>
  )
}
