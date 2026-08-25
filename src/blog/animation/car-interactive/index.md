---
title: 'Vue + Three.js 实现 3D 汽车交互展示'
description: '上一篇基础版已经完成了模型加载、展台、灯光、环境反射和车漆切换。'
pubDate: '2026-08-25'
category: '动画动效'
categorySlug: 'animation'
tags: ['Three.js', '动效']
difficulty: 5
source: 'vue-practice/src/views/animation/car-showcase/interactive.md'
demoSlug: 'animation-car-showcase-interactive'
---

## 前言

上一篇基础版已经完成了模型加载、展台、灯光、环境反射和车漆切换。

这一篇进入交互版：让车不只是“摆在那里”，而是可以被用户操作。

对应源码：

```text
src/views/animation/car-showcase/interactive.vue
```

目标模型：

[Animated Chevrolet C8 Model - Sketchfab](https://sketchfab.com/3d-models/animated-chevrolet-c8-model-91d39ff24d6c4e7b83674411f9c5bb67)

这个模型本身带有动画片段，页面描述里也提到可以动画控制车门、机盖和车轮。相比普通静态车模，它更适合作为 Three.js 交互展示案例。

实际放到项目里的运行时文件是：

```text
src/views/animation/car-showcase/models/chevrolet-corvette-c8.glb
```

我解析后看到它包含 `238` 个节点、`72` 个 Mesh、`51` 个材质、`7` 个动画片段。当前代码最终只保留能稳定生效的车门、前备箱、后备箱、车轮、灯光和车漆切换。

不过它的动画片段名字比较泛，比如 `Object_239Action`，不能单纯靠动画名字判断“这是左门还是右门”。所以交互版会读取动画目标节点，再沿着父级节点往上找，根据 `Left Door`、`Frunk`、`Trunk` 这些祖先名字完成归类。

## 页面高度

交互版运行在博客的 demo 预览页里，外层已经有站点 Header、demo Header 和 Footer，所以组件根节点不要再写 `min-height: 100vh`。

这里让汽车页面继承中间舞台的高度，并由组件内部隐藏溢出：

```less
.interactive-car-page {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
```

同时 demo 页面只对汽车基础版和交互版关闭中间舞台滚动，其他需要滚动查看内容的案例不受影响。

## 交互版增加了什么？

交互版主要预留和实现这些功能：

1. 开车门；
2. 打开前备箱；
3. 打开后备箱；
4. 转动车轮；
5. 灯光控制；
6. 鼠标自由进入内饰视角。

这里有一个重点：这些功能不是全部依赖模型本身，也不是所有 GLB 都能完整支持。

像车漆属于材质能力；车门、机盖、车轮才真正依赖模型节点是否拆分合理。

进入内饰视角本质上是相机控制能力。它不要求模型提供动画片段，但要求模型内部确实有座舱、方向盘、座椅、中控这些细节。C8 这份模型包含 `Interior`、`Steering Wheel`、车窗等节点，所以可以通过鼠标滚轮推进到座舱内部，再拖拽旋转查看内饰。

## 当前视觉基准

交互版和基础版现在保持同一套初始视觉：

1. 默认车漆是红色；
2. 红色色卡排在第一个；
3. 删除外面的白色光圈；
4. 不创建实心地板，只保留网格参考线；
5. 背景色、雾化参数和基础版保持一致；
6. 初始镜头更靠近汽车；
7. 整体灯光和曝光更克制，避免红色车漆高光过曝。

车漆默认值是：

```ts
const activePaint = ref('corvette-red')
```

色卡顺序从红色开始：

```ts
const paintOptions: CarPaintOption[] = [
  { name: 'corvette-red', label: 'Corvette Red', color: '#8f1418' },
  { name: 'ceramic-white', label: 'Ceramic White', color: '#98a3ad' },
  { name: 'blade-silver', label: 'Blade Silver', color: '#b5bec7' },
  { name: 'night-black', label: 'Night Black', color: '#05070a' },
]
```

展台只保留网格：

```ts
const grid = new THREE.GridHelper(18, 36, '#64748b', '#334155')
grid.position.y = 0.018
scene?.add(grid)
```

这里没有地板，也没有 `TorusGeometry` 画出来的白色外圈。这样画面注意力会更集中在汽车本身，基础版和交互版的第一眼观感也更统一。

## 交互模型的关键

普通模型和交互模型最大的区别，不是外观，而是结构。

如果一辆车的车身、车门、机盖全部合并成一个 Mesh，那么你想开车门就很困难。因为车门已经不是一个独立对象了。

适合交互的模型，通常需要满足：

1. 车门是独立节点；
2. 机盖是独立节点；
3. 车轮是独立节点；
4. 每个可开合部件的 pivot 在正确位置。

所谓 pivot，可以理解成物体旋转的轴心。

车门能不能像真实车门一样打开，关键不只是 `rotation.y += 1`，而是车门节点的旋转中心是不是在铰链位置。

## 自动收集部件

交互版没有直接写死某一个节点名，而是先通过关键词收集：

```ts
parts.doors.push(...collectTopLevelObjects(model, ['door'], ['sill']))
parts.hood.push(...collectTopLevelObjects(model, ['frunk'], ['badge', 'logo']))
parts.trunk.push(...collectTopLevelObjects(model, ['trunk', 'boot'], ['badge', 'logo']))
parts.wheels.push(...collectTopLevelObjects(model, ['wheel', 'tire', 'tyre'], ['steering']))
```

这样写的好处是：不同模型的节点名可能不完全一致。

有的模型叫 `hood`，有的叫 `bonnet`；有的叫 `trunk`，有的叫 `boot`。

用关键词收集，可以让代码具备一点兼容性。

C8 里前备箱直接叫 `Frunk`，所以这里优先收集 `frunk`。如果换成其他模型，没有 `frunk` 节点，再退回去找 `hood` 或 `bonnet`。

## 为什么只收顶层对象？

模型结构通常是树形结构：

```text
door_left
├─ door_panel
├─ door_glass
└─ door_handle
```

如果我们把 `door_left` 和它下面的 `door_panel`、`door_glass`、`door_handle` 全部收进来，点击开门时就会重复旋转。

所以代码里做了一层判断：

```ts
if (hasMatchedAncestor(object, root, keywords)) {
  return
}
```

意思是：如果父级已经命中了 `door/hood/trunk` 这些关键词，就只收父级，不再收子级。

这样动画时只需要操作一个完整部件。

## 保存初始状态

所有可开合部件，都需要先保存初始位置和旋转：

```ts
const getSnapshot = (object: THREE.Object3D) => {
  let snapshot = transformSnapshots.get(object)

  if (!snapshot) {
    snapshot = {
      position: object.position.clone(),
      rotation: object.rotation.clone(),
    }
    transformSnapshots.set(object, snapshot)
  }

  return snapshot
}
```

为什么要保存？

因为用户点击“打开”后，还要能点击“关闭”。

关闭不是随便设置成 `0`，而是回到模型原本的 `position` 和 `rotation`。很多模型初始状态并不是完全 0，所以保存初始状态更稳。

## 优先使用 GLB 自带动画

C8 的动画片段已经存在于 GLB 里，所以开车门、前备箱和后备箱会优先使用 `AnimationMixer` 播放模型自带动画。

```ts
animationMixer = new THREE.AnimationMixer(model)

const action = animationMixer.clipAction(clip)
action.setLoop(THREE.LoopOnce, 1)
action.clampWhenFinished = true
```

`AnimationMixer` 可以理解成 Three.js 里的动画播放器。`clipAction` 会把某一段 `AnimationClip` 变成可播放的动作。

模型自带动画的好处是：它已经包含了作者调好的旋转轴、位移和姿态。对于 C8 这种剪刀门，如果我们自己猜 `rotation.x` 或 `rotation.y`，很容易开得不自然。

## 动画归类

C8 的动画名是 `Object_239Action` 这种形式，名字本身看不出含义。

所以代码会先读取动画目标节点，再往父级找：

```ts
const getAnimationTargetText = (clip: THREE.AnimationClip, root: THREE.Object3D) => {
  const texts = new Set<string>()

  clip.tracks.forEach((track) => {
    const targetName = getTrackTargetName(track.name)
    let current = targetName ? root.getObjectByName(targetName) : null

    while (current) {
      texts.add(getObjectText(current))

      if (current === root) {
        break
      }

      current = current.parent
    }
  })

  return Array.from(texts).join(' ')
}
```

比如某段动画目标叫 `Object_239`，但它的父级链路里能找到 `Left Door_122`，那它就可以归类到车门动画里。

归类后的播放逻辑是：

```ts
const playAnimatedActions = (key: AnimatedPartKey, open: boolean) => {
  const actions = animatedActions[key]

  actions.forEach((action) => {
    const duration = action.getClip().duration

    action.paused = true
    action.play()

    gsap.to(action, {
      time: open ? 0 : duration,
      duration: 0.75,
      ease: 'power2.out',
      onUpdate: () => animationMixer?.update(0),
    })
  })
}
```

C8 这份模型比较特别：动画第 `0` 帧是打开态，末帧是闭合态。所以按钮逻辑需要反过来：打开时从末帧倒播到第 `0` 帧；关闭时再从第 `0` 帧正播回末帧。

## 使用 GSAP 兜底

不是所有模型都有动画片段。如果某个部件没有匹配到 GLB 动画，交互版仍然会用 GSAP 补间部件的 `rotation` 和 `position`：

```ts
gsap.to(object.rotation, {
  ...targetRotation,
  duration: 0.7,
  ease: 'power2.out',
})
```

Three.js 的 `Object3D` 本身就有 `position`、`rotation`、`scale`。GSAP 可以直接补间这些普通对象属性，所以写法很直接。

## 开车门

车门左右两侧打开方向不同，所以先判断部件在左边还是右边：

```ts
const side = getObjectSide(part)
animatePart(part, featureState.doors, {
  y: side === 'left' ? -0.92 : 0.92,
})
```

这段代码只会在没有匹配到车门动画时执行。

C8 本身带有车门动画，所以实际点击“车门”按钮时，优先播放模型里的 `Left Door` 和 `Right Door` 动画。这样剪刀门的展开姿态会更自然。

这也是做 3D 交互时很常见的一点：代码逻辑可以通用，但具体角度和轴向要结合模型实际结构调整。

## 打开前备箱和后备箱

前备箱：

```ts
parts.hood.forEach((part) => {
  animatePart(part, featureState.hood, { x: -0.72 })
})
```

后备箱：

```ts
parts.trunk.forEach((part) => {
  animatePart(part, featureState.trunk, { x: 0.72 })
})
```

C8 的前备箱对应 `Frunk`，后部对应 `Trunk [or Hood]`。如果这两个部件能找到自带动画，就直接播放动画；否则才退回到上面的 GSAP 旋转逻辑。

## 车轮旋转

车轮旋转放在渲染循环里：

```ts
const spinWheels = () => {
  if (!featureState.wheels) {
    return
  }

  parts.wheels.forEach((wheel) => {
    wheel.rotation.x += 0.04
  })
}
```

这里先按 `x` 轴旋转处理。

如果实际模型的车轮轴不是 x 轴，只需要改成：

```ts
wheel.rotation.z += 0.12
```

或者其他轴即可。

## 灯光控制

灯光这里只保留最明显的前照灯和尾灯。

一开始我尝试把日行灯、转向灯、倒车灯、牌照灯都识别出来，但这些灯位在当前模型里不够明显，写太多分支反而会干扰阅读。所以最终保留一个更适合学习的版本：识别主灯，克隆材质，然后通过 `emissiveIntensity` 控制开关。

```ts
const createLightMaterial = (sourceMaterial: THREE.Material, text: string) => {
  const material =
    sourceMaterial instanceof THREE.MeshStandardMaterial
      ? sourceMaterial.clone()
      : new THREE.MeshStandardMaterial()
  const isRearLight = includesAny(text, ['tail', 'brake'])

  material.color.set(isRearLight ? '#3f080e' : '#eef6ff')
  material.emissive.set(isRearLight ? '#ff2638' : '#fff4d6')
  material.emissiveIntensity = 0.08
  material.userData.lightOnIntensity = isRearLight ? 1.05 : 2.15
  material.userData.lightOffIntensity = 0.08

  return material
}
```

模型遍历时也不用处理所有带 `light` 字样的材质，只保留主灯：

```ts
const isMainLightMesh = (text: string) => {
  const ignored = ['day light', 'indicator', 'reverse', 'license', 'brake disc']

  return (
    includesAny(text, ['light', 'headlight', 'taillight', 'brake']) && !includesAny(text, ignored)
  )
}
```

开关按钮只改亮度：

```ts
const updateLights = () => {
  const intensityKey = featureState.lights ? 'lightOnIntensity' : 'lightOffIntensity'

  lightMaterials.forEach((material) => {
    material.emissiveIntensity = Number(material.userData[intensityKey])
    material.needsUpdate = true
  })
}
```

这样虽然功能少一点，但代码更清楚：前灯暖白、尾灯红色，关灯时降低自发光强度。

## 鼠标进入内饰

进入内饰不是额外做一个按钮跳转，而是调整 `OrbitControls` 的控制范围，让用户可以通过鼠标自由进入：

```ts
const initialCameraPosition = new THREE.Vector3(2.15, 0.55, 4.85)
const cockpitTargetPosition = new THREE.Vector3(-0.08, 0.76, 0.22)
```

初始化相机时，让镜头看向座舱附近：

```ts
camera.position.copy(initialCameraPosition)
controls.target.copy(cockpitTargetPosition)
```

然后放开控制器限制：

```ts
controls.enablePan = true
controls.screenSpacePanning = true
controls.minDistance = 0.18
controls.minPolarAngle = 0.05
controls.maxPolarAngle = Math.PI - 0.05
```

这里几个参数的作用是：

1. `enablePan`：允许按住鼠标右键或触控板平移视线；
2. `minDistance`：允许滚轮把相机推得更近，进入座舱内部；
3. `minPolarAngle` 和 `maxPolarAngle`：放开上下旋转范围，进入内饰后可以 360 度查看；
4. `camera.near`：调小到 `0.03`，避免镜头靠近车窗或进入车内时把内饰裁掉。

## 交互版的真实难点

这类交互案例最难的不是 Three.js API，而是模型结构。

如果模型节点拆得好，代码可以很简单。

如果模型节点全部合并，代码再复杂也很难做出自然开合。

所以拿到模型后，第一步应该打印节点树：

```ts
model.traverse((object) => {
  console.log(object.name)
})
```

然后确认：

1. 车门节点叫什么；
2. 机盖节点叫什么；
3. 车轮节点叫什么；
4. 灯光材质叫什么。

当前代码已经做了关键词兜底，后续如果要更稳定，建议根据真实节点名把匹配条件改成精确配置。

## 放在最后的话

基础版解决的是“模型能不能展示”。

交互版解决的是“模型能不能被操作”。

这两件事看起来只差几个按钮，但背后的思路完全不一样。

展示版关注场景、灯光、材质、相机和资源清理。

交互版关注节点结构、pivot、状态保存、动画补间和部件匹配。

AI 可以生成按钮，也可以生成 `gsap.to`，但它不会替你确认模型的 pivot 是否正确，也不会替你判断哪个节点才是真正的车门。

这就是为什么我们需要看懂 AI 代码，也需要看懂模型结构。

能看懂，才知道问题出在代码，还是出在模型。
