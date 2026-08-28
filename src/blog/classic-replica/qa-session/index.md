---
title: '网易音乐七夕活动复刻'
description: '前言 在日常的开发过程中，我们常常需要复刻某些经典的需求———— 既要高度还原优质的交互体验，又要适配不同的业务场景。比如：最近公司让我做一个德国冬季口味营销活动，具体的交互参考网易云七夕营销活动，由于公司的代码是nuxt实现的并支持外网访'
pubDate: '2021-08-13'
category: '经典复刻'
categorySlug: 'classic-replica'
tags: ['qa-session']
difficulty: 4
source: 'vue-practice/src/views/classic-replica/qa-session/index.md'
demoSlug: 'classic-replica-qa-session'
---

## 前言

在日常的开发过程中，我们常常需要复刻某些经典的需求———— 既要高度还原优质的交互体验，又要适配不同的业务场景。比如：最近公司让我做一个德国冬季口味营销活动，具体的交互参考网易云七夕营销活动，由于公司的代码是nuxt实现的并支持外网访问，所有我打算用react重新复现一下这个活动（素材使用网易云的七夕活动中的素材）。本文将从技术角度拆解复刻过程中的核心思路和踩坑经验。

## 网易云七夕活动页面

这里是网易云七夕活动页面原地址 [网易云七夕活动](https://y.music.163.com/g/yida/2024love/C_g607j64ar2?app_version=9.4.05&dlt=0846&userid=1810128822&page=1ba8b6833ac04d0890e9d5baefca24b4) 供大家进行参考，本次主要聚焦的是**问答活动模块**的内容，对于结果页面暂不进行开发，如有侵权和冒犯之处，敬请谅解。

## 技术拆解

在整个复刻七夕活动的过程中，最核心的难点在于：如何大量高清图片切换的过程中，保持动画的连贯性且不会卡顿？

## 初版

定位：快速实现功能原型，但存在明显的性能和体验瓶颈。

核心代码展示

```jsx
const Index = () => {
  const [currentStep, setCurrentStep] = useState(0)

  const handleBeginTesting = () => {
    setCurrentStep(1)
  }

  const handleAnsweringQuestion = () => {
    setCurrentStep((a) => a + 1)
  }

  return (
    <div className="first-edition-container">
      {questionList.map((item, index) => {
        return (
          <div
            className={`step-content step${index} ${currentStep !== index ? 'fade-item' : 'fade-enter-done'}`}
            key={index}
          >
            <img className="image-bg" src={item.imgSrc} alt="" />
            {index === 0 && <div onClick={handleBeginTesting} className="begin-testing"></div>}
            {!!item.question1 && (
              <img
                onClick={handleAnsweringQuestion}
                className="question question1"
                src={item.question1}
                alt=""
              />
            )}
            {!!item.question2 && (
              <img
                onClick={handleAnsweringQuestion}
                className="question question2"
                src={item.question2}
                alt=""
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
```

```less
// 动画部分
.first-edition-container .fade-item {
  opacity: 0;
  -webkit-transition: opacity 1s ease-in-out;
  -o-transition: opacity 1s ease-in-out;
  -moz-transition: opacity 1s ease-in-out;
  transition: opacity 1s ease-in-out;
  z-index: 10;
}

.first-edition-container .fade-enter-done {
  opacity: 1;
  -webkit-transition: opacity 1s ease-in-out;
  -o-transition: opacity 1s ease-in-out;
  -moz-transition: opacity 1s ease-in-out;
  transition: opacity 1s ease-in-out;
  z-index: 100;
}
```

### 以下是初版的详细代码分析：

1. 核心逻辑

- 全量挂载：通过 questionList.map 一次性将所有题目渲染到 DOM 树中。

- 状态切换：仅依靠一个 currentStep 变量，配合 CSS 类名（fade-item vs fade-enter-done）来控制题目的显示与隐藏。

- 逻辑简单：函数组件内部只有最基础的 useState，没有复杂的生命周期管理

2. 缺陷

- 首屏渲染压力较大： 由于采用全量渲染模式，网站一打开加载所有的图片资源，在弱网的情况下，可能会导致首屏加载时间过长，白屏等情况。

- 缺乏动画的精细度：代码中仅通过简单的类名去控制 opacity 的变化，在网易云的原版交互中，背景图、问题1、问题2是由先后顺序的阶梯式淡入。

## 初版--效果展示

[jcode](https://code.juejin.cn/pen/7595789985958068250)

## 进阶版

定位：从“简单的 UI 切换”转向了**“精细化交互控制”**。

核心代码展示

```jsx
const StepItem = ({ item, index, isActive, onBegin, onAnswer }) => {
  // 动画状态
  const [imageOpacity, setImageOpacity] = useState(0)
  const [question1Opacity, setQuestion1Opacity] = useState(0)
  const [question2Opacity, setQuestion2Opacity] = useState(0)

  // 图片加载完成标志
  const [imageLoaded, setImageLoaded] = useState(false)

  // 动画完成标志
  const imageAnimationDone = useRef(false)
  const question1AnimationDone = useRef(false)

  // 当组件变为激活状态时开始动画
  useEffect(() => {
    if (isActive) {
      // 重置动画状态
      setImageOpacity(0)
      setQuestion1Opacity(0)
      setQuestion2Opacity(0)
      imageAnimationDone.current = false
      question1AnimationDone.current = false
    }
  }, [isActive])

  useEffect(() => {
    let question1Timer = null
    let question2Timer = null

    // 如果状态未激活或者图片没有加载完成直接终止
    if (!isActive || !imageLoaded) return

    const runImageAnimation = () => {
      setImageOpacity(1)
      imageAnimationDone.current = true
    }

    const runQuestion1Animation = () => {
      question1Timer = setTimeout(() => {
        if (!item.question1) return // 无question1 → 终止
        setQuestion1Opacity(1)
        question1AnimationDone.current = true
        runQuestion2Animation() // 执行完question1，再执行question2
      }, 500)
    }

    const runQuestion2Animation = () => {
      if (!item.question2) return // 无question2 → 终止
      question2Timer = setTimeout(() => {
        setQuestion2Opacity(1)
      }, 500)
    }

    // 执行图片动画
    runImageAnimation()
    // 执行问题1动画
    runQuestion1Animation()

    return () => {
      clearTimeout(question1Timer)
      clearTimeout(question2Timer)
    }
  }, [isActive, imageLoaded, item.question1, item.question2])

  return (
    <div className={`step-content step${index} ${isActive ? 'fade-enter-done' : 'fade-item'}`}>
      <img
        className="image-bg"
        src={item.imgSrc}
        alt=""
        style={{ opacity: imageOpacity }}
        onLoad={() => setImageLoaded(true)}
      />
      {index === 0 && <div onClick={onBegin} className="begin-testing"></div>}
      {!!item.question1 && (
        <img
          onClick={onAnswer}
          className="question question1"
          src={item.question1}
          alt=""
          style={{ opacity: question1Opacity }}
        />
      )}
      {!!item.question2 && (
        <img
          onClick={onAnswer}
          className="question question2"
          src={item.question2}
          alt=""
          style={{ opacity: question2Opacity }}
        />
      )}
    </div>
  )
}

const Index = () => {
  const [currentStep, setCurrentStep] = useState(0)

  const handleBeginTesting = () => {
    setCurrentStep(1)
  }

  const handleAnsweringQuestion = () => {
    setCurrentStep((a) => a + 1)
  }

  return (
    <div className="second-edition-container">
      {questionList.map((item, index) => {
        return (
          <StepItem
            key={index}
            item={item}
            index={index}
            isActive={currentStep === index}
            onBegin={handleBeginTesting}
            onAnswer={handleAnsweringQuestion}
          />
        )
      })}
    </div>
  )
}
```

```less
// 动画部分
.second-edition-container .fade-item {
  z-index: 10;
}

.second-edition-container .fade-enter-done {
  z-index: 100;
}
```

### 以下是进阶版的详细代码分析：

1. 核心改进：时序控制动画

- 通过 setTimeout 链式调用，模拟了网易云原版中素材错落有致的入场效果。

2. 引入图片加载监测

- 初版中动画是随 DOM 挂载直接触发的，而进阶版增加了 imageLoaded 状态，通过 onLoad 事件确保图片资源真实下载完成后才启动透明度动画。

3. 组件化拆分

- 将每一道题逻辑封装在 StepItem 中，每个 StepItem 维护自己的 opacity 状态，逻辑互不干扰，父组件只负责维护 currentStep 进度，职责单一化。

4. 存在的不足

- 性能瓶颈（全量渲染依然存在）： 虽然抽离了组件，但 Index 里依然在 map 全量渲染所有的 StepItem。

## 进阶版--效果展示

[jcode](https://code.juejin.cn/pen/7595792784619995162)

## 最终版

定位：不仅需要完美的视觉效果，还需要深入到了 React 性能优化底层。

核心代码展示

```jsx
const StepItem = React.memo(({ item, index, isActive, onBegin, onAnswer }) => {
  // 合并动画状态为一个对象，减少状态更新次数
  const [animationState, setAnimationState] = useState({
    imageOpacity: 0,
    question1Opacity: 0,
    question2Opacity: 0,
  })
  const [imageLoaded, setImageLoaded] = useState(false)
  const imageRef = useRef(null)

  // 当组件变为激活状态时重置动画状态
  useEffect(() => {
    if (isActive) {
      setAnimationState({
        imageOpacity: 0,
        question1Opacity: 0,
        question2Opacity: 0,
      })
      setImageLoaded(false)
    }
    // 检查图片是否已经加载完成（处理缓存情况）
    if (isActive && imageRef.current) {
      // 如果图片已经加载完成（从缓存中），立即设置加载状态
      if (imageRef.current.complete && imageRef.current.naturalHeight !== 0) {
        setImageLoaded(true)
      }
    }
  }, [isActive])

  // 处理动画序列
  useEffect(() => {
    if (!isActive || !imageLoaded) return

    const timers = []

    // 立即显示图片
    setAnimationState((prev) => ({ ...prev, imageOpacity: 1 }))

    // 延迟显示 question1
    if (item.question1) {
      const question1Timer = setTimeout(() => {
        setAnimationState((prev) => ({ ...prev, question1Opacity: 1 }))

        // question1 显示后，延迟显示 question2
        if (item.question2) {
          const question2Timer = setTimeout(() => {
            setAnimationState((prev) => ({ ...prev, question2Opacity: 1 }))
          }, 500)
          timers.push(question2Timer)
        }
      }, 500)
      timers.push(question1Timer)
    }

    return () => {
      timers.forEach((timer) => clearTimeout(timer))
    }
  }, [isActive, imageLoaded, item.question1, item.question2])

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true)
  }, [])

  const stepClassName = useMemo(
    () => `step-content step${index} ${isActive ? 'fade-enter-done' : 'fade-item'}`,
    [index, isActive],
  )

  return (
    <div className={stepClassName}>
      <img
        ref={imageRef}
        className="image-bg"
        src={item.imgSrc}
        alt=""
        style={{ opacity: animationState.imageOpacity }}
        onLoad={handleImageLoad}
      />
      {index === 0 && <div onClick={onBegin} className="begin-testing" />}
      {item.question1 && (
        <img
          onClick={onAnswer}
          className="question question1"
          src={item.question1}
          alt=""
          style={{ opacity: animationState.question1Opacity }}
        />
      )}
      {item.question2 && (
        <img
          onClick={onAnswer}
          className="question question2"
          src={item.question2}
          alt=""
          style={{ opacity: animationState.question2Opacity }}
        />
      )}
    </div>
  )
})

StepItem.displayName = 'StepItem'

const Index = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const handleBeginTesting = useCallback(() => {
    setCurrentStep(1)
  }, [])

  const handleAnsweringQuestion = useCallback(() => {
    setCurrentStep((prev) => prev + 1)
  }, [])

  const renderedItems = useMemo(() => {
    return questionList
      .map((item, index) => ({ item, index }))
      .filter(({ index }) => index <= currentStep + 1)
  }, [currentStep])

  return (
    <div className="third-edition-container">
      {renderedItems.map(({ item, index }) => (
        <StepItem
          key={index}
          item={item}
          index={index}
          isActive={currentStep === index}
          onBegin={handleBeginTesting}
          onAnswer={handleAnsweringQuestion}
        />
      ))}
    </div>
  )
}
```

### 以下是最终版的详细代码分析：

1. 性能优化组合

- React.memo + useCallback：通过记忆化组件和持久化函数引用，确保当 currentStep 变化时，只有“当前活跃题”和“下一题”会触发必要的重绘，其他已加载的题目完全静止。

2. 状态对象化

- 将三个独立的 opacity 状态合并为 animationState 对象。这意味着原本需要三次 setState（触发三次渲染）的操作，现在只需一次即可完成。

3. 图片预加载与缓存策略

- `.filter(({ index }) => index <= currentStep + 1)` 这一行代码实现了“只加载看过的”和“提前加载下一题”。这既节省了首屏流量，又保证了切换时的瞬间呈现。

## 最终版--效果展示

[jcode](https://code.juejin.cn/pen/7597005376978386970)

## 总结

从最初的一个 map 一把梭，到最后引入 React.memo、资源预加载以及对缓存机制的深度打磨。从好用’和‘丝滑’的背后是极其严谨的性能管理。希望这份进阶之路能给你一些启发。
