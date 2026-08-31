---
title: 'Vue + Three.js 实现 3D 汽车交互展示'
description: '在基础版 3D 汽车展示之上，继续增加车门、前备箱、后备箱、车轮、灯光和内饰视角交互。'
pubDate: '2026-04-16'
category: '动画动效'
categorySlug: 'animation'
tags: ['Three.js', '动效']
difficulty: 5
source: 'vue-practice/src/views/animation/car-showcase/interactive.md'
demoSlug: 'animation-car-showcase-interactive'
---

## 前言

第一版已经把静态展示链路跑通了：模型加载、场景、相机、灯光、环境反射、车漆材质和资源清理都讲过了。

所以这一篇不再重复解释 `scene / camera / renderer` 分别是什么，也不再从头讲 GLB 模型怎么放进项目。这里直接进入第二步：把那辆静态展示的科尔维特 C8，改成可以操作的 3D 展示页。

这一版主要新增了这些能力：

1. 车门、前备箱、后备箱可以开合；
2. 车轮可以转动；
3. 前灯和尾灯可以开关；
4. 鼠标滚轮可以推进到座舱内查看内饰；
5. 车漆切换继续保留，但识别方式更收敛；
6. 动画播放逻辑从“只应用初始姿态”升级成“收集动画并复用”。

这篇更像是基础版的进阶补丁：不再讲“怎么把车显示出来”，而是讲“怎么让车能被用户玩起来”。

## 先看差异

基础版加载模型后，只需要保证车是闭合的，然后让整车轻微自转即可。交互版不一样，它后面还要反复打开、关闭，所以加载流程也跟着调整了：

```ts
prepareCarModel(model)
collectAnimatedActions(model, gltf.animations)
fitModelToStage(model)

carGroup = new THREE.Group()
carGroup.add(model)
carGroup.rotation.y = -0.48
scene.add(carGroup)
```

和第一版相比，最关键的变化是 `collectAnimatedActions(model, gltf.animations)`。

第一版里我们只是用 `applyInitialAnimationPose` 把模型自带动画推到闭合状态，推完就结束。交互版不能这么处理，因为后面点击按钮时还要继续播放车门、前备箱、后备箱动画。

所以这一版会把 GLB 里的动画片段先收集起来，按照部件类型放到 `animatedActions` 里：

```ts
const animatedActions: Record<AnimatedPartKey, THREE.AnimationAction[]> = {
  doors: [],
  hood: [],
  trunk: [],
}
```

这样按钮点击时不用重新解析模型，只需要找到对应数组里的动作播放即可。

## 交互的前提

做 3D 汽车交互，真正的难点通常不是按钮，也不是 `gsap.to`，而是模型结构。

如果一辆车的车身、车门、机盖全部合并成一个 Mesh，那代码就很难让车门单独打开。适合交互的模型，至少要满足这些条件：

1. 车门是独立节点；
2. 机盖是独立节点；
3. 车轮是独立节点；
4. 每个可开合部件的 pivot 在正确位置。

`pivot` 可以理解成物体旋转的轴心。车门能不能像真实车门一样打开，不只取决于你写 `rotation.y += 1`，更取决于模型里的车门旋转中心是不是在铰链位置。

## 自动收集部件

交互版没有把某一个节点名完全写死，而是先按关键词收集可交互部件：

```ts
parts.doors.push(...collectTopLevelObjects(model, ['door'], ['sill']))
parts.hood.push(...collectTopLevelObjects(model, ['frunk'], ['badge', 'logo']))
parts.trunk.push(...collectTopLevelObjects(model, ['trunk', 'boot'], ['badge', 'logo']))
parts.wheels.push(...collectTopLevelObjects(model, ['wheel', 'tire', 'tyre'], ['steering']))
```

这里有两个小优化。

第一，前备箱优先找 `frunk`。因为科尔维特 C8 是中置发动机，前面不是传统发动机舱，而是前备箱。如果没找到 `frunk`，再退回去找 `hood / bonnet`。

第二，车轮会找 `wheel / tire / tyre`，但会排除 `steering`。否则方向盘也可能被错误归到轮子里。

## 为什么只收顶层对象？

模型结构通常是树形结构：

```text
door_left
├─ door_panel
├─ door_glass
└─ door_handle
```

如果把 `door_left` 和它下面的 `door_panel`、`door_glass`、`door_handle` 全部收进来，点击开门时父级转一次，子级又转一次，动画就会叠加变形。

所以收集时会先判断父级是否已经命中过：

```ts
if (hasMatchedAncestor(object, root, keywords)) {
  return
}
```

这段代码的意思是：如果父级已经是 `door / hood / trunk` 这类部件，就只收父级，不再继续收内部 Mesh。

这不是为了代码好看，是为了避免动画重复叠加。

## 动画不能只看名字

这份 C8 模型自带 `7` 个动画片段，但动画名比较泛，比如 `Object_239Action`。只看名字，你根本不知道这是左门、右门，还是别的部件。

所以交互版没有直接判断动画名，而是读取动画轨道里的目标节点，再沿着父级往上找：

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

比如动画目标节点叫 `Object_239`，但它的父级链路里能找到 `Left Door`，那这段动画就可以归到 `doors`。

归类逻辑是这样的：

```ts
if (includesAny(text, ['door'])) {
  key = 'doors'
} else if (
  includesAny(text, ['frunk', 'bonnet']) ||
  (includesAny(text, ['hood']) && !includesAny(text, ['trunk', 'boot']))
) {
  key = 'hood'
} else if (includesAny(text, ['trunk', 'boot'])) {
  key = 'trunk'
}
```

这里对 `hood` 做了额外判断：如果同一段文本里同时出现 `trunk / boot`，就不要把它误判成前备箱。因为有些模型会把后盖命名成类似 `Trunk [or Hood]`。

## 初始闭合状态

基础版可以用一次性的 `applyInitialAnimationPose` 把模型推到闭合状态。交互版需要继续复用动画，所以改成了这个方法：

```ts
const resetAnimatedActionsToStart = () => {
  const actions = Object.values(animatedActions).flat()

  actions.forEach((action) => {
    const duration = action.getClip().duration

    action.reset()
    action.setLoop(THREE.LoopOnce, 1)
    action.clampWhenFinished = true
    action.enabled = true
    action.paused = true
    action.time = duration
    action.play()
  })

  animationMixer?.update(0)
}
```

这里有个很容易踩坑的点：这份 C8 模型的第 `0` 帧是打开态，末帧才是闭合态。

所以初始化时不能把动画时间设置成 `0`，而是要设置成 `duration`。这样页面刚打开时，车门、前备箱、后备箱才是关闭的。

## 播放开合动画

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

因为第 `0` 帧是打开态，末帧是闭合态，所以这里的按钮逻辑看起来是反的：

1. 打开时，把 `action.time` 从末帧补间到 `0`；
2. 关闭时，把 `action.time` 从 `0` 补间回末帧。

这里用 GSAP 补间的不是模型节点，而是 `AnimationAction` 的 `time`。每次 `time` 改变后，通过 `animationMixer?.update(0)` 把当前动画姿态刷新到模型上。

相比自己写旋转角度，优先播放 GLB 自带动画更稳。尤其是 C8 这种剪刀门，动画作者已经调好了旋转轴、位移和姿态，代码只负责播放进度。

## 没有动画时怎么办？

不是所有模型都有自带动画。为了让案例有一点兼容性，如果某个部件没有匹配到 GLB 动画，交互版会退回到 GSAP 补间 `Object3D` 的 `rotation / position`：

```ts
gsap.to(object.rotation, {
  ...targetRotation,
  duration: 0.7,
  ease: 'power2.out',
})
```

不过兜底动画有一个前提：模型的 pivot 要对。

如果车门节点的 pivot 在铰链处，旋转就像开门。如果 pivot 在车门中心，那效果就会像一块门板原地打转。

车门左右两侧打开方向不同，所以兜底时还会判断部件在左边还是右边：

```ts
const side = getObjectSide(part)
animatePart(part, featureState.doors, {
  y: side === 'left' ? -0.92 : 0.92,
})
```

前备箱和后备箱也一样：

```ts
parts.hood.forEach((part) => {
  animatePart(part, featureState.hood, { x: -0.72 })
})

parts.trunk.forEach((part) => {
  animatePart(part, featureState.trunk, { x: 0.72 })
})
```

这些角度不是通用公式，只是当前模型的兜底值。换模型后，真正应该优先检查的是模型节点和 pivot。

## 车轮旋转

车轮没有必要每次点击按钮都创建一个补间动画。当前实现更简单：按钮只切换状态，真正的旋转放在渲染循环里。

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

渲染循环里新增了两件事：

```ts
animationMixer?.update(animationClock.getDelta())
spinWheels()
```

`animationMixer.update` 用来推进模型自带动画，`spinWheels` 只在 `featureState.wheels` 为 `true` 时执行。

当前模型的车轮按 `x` 轴旋转。如果换了别的模型，轴向不对，就把这一行改成对应轴即可：

```ts
wheel.rotation.z += 0.12
```

## 灯光控制

灯光这里没有强行把所有发光部件都做出来，只保留最明显的前灯和尾灯。

原因很简单：这个模型里日行灯、转向灯、倒车灯、牌照灯并不都明显。如果为了“功能看起来很多”写一堆分支，文章会变长，但效果未必更好。

最终保留的思路是：识别主灯 Mesh，克隆材质，给它加上自发光属性。

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

识别主灯时会排除一些容易误伤的关键词：

```ts
const isMainLightMesh = (text: string) => {
  const ignored = ['day light', 'indicator', 'reverse', 'license', 'brake disc']

  return (
    includesAny(text, ['light', 'headlight', 'taillight', 'brake']) && !includesAny(text, ignored)
  )
}
```

按钮开关不替换材质，只改 `emissiveIntensity`：

```ts
const updateLights = () => {
  const intensityKey = featureState.lights ? 'lightOnIntensity' : 'lightOffIntensity'

  lightMaterials.forEach((material) => {
    material.emissiveIntensity = Number(material.userData[intensityKey])
    material.needsUpdate = true
  })
}
```

这样开关灯的成本很低，也不会频繁创建新材质。

前灯偏暖白，尾灯偏红；关灯时不是完全黑掉，而是保留一点很低的自发光，避免灯罩在暗色背景里彻底丢失。

## 鼠标进入内饰

进入内饰不是额外做一个“进入座舱”按钮，而是调整 `OrbitControls` 的控制范围，让用户用鼠标滚轮直接推进去。

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

这里和基础版的区别比较明显：

1. `enablePan`：允许按住鼠标右键或触控板平移视线；
2. `screenSpacePanning`：让平移更符合屏幕方向；
3. `minDistance`：允许相机贴近车窗，甚至进入座舱；
4. `minPolarAngle / maxPolarAngle`：放开上下视角，不再把相机限制在地面以上；
5. `camera.near = 0.03`：镜头靠近内饰时，不容易被近裁剪面切掉。

基础版更像产品海报，镜头应该稳定、克制。交互版更像一个小型配置器，所以相机控制要给用户更多自由度。

## 车漆识别也收紧了

基础版讲过车漆为什么不能只改颜色，这里不重复讲 PBR 参数了。交互版继续复用同一份车漆配置：

```ts
import { paintOptions, type PaintOption } from '../../../content-data/animation.ts'
```

这样基础版和交互版的色卡顺序、默认红色、金属度、粗糙度、清漆层和环境反射参数都保持一致。后面如果要调某个颜色的质感，只需要改共享配置，不用两篇案例各改一遍。

交互版需要补充的是：车身 Mesh 的识别方式变得更明确。

打印过 `mesh.name` 和 `material?.name` 后，可以看到这份模型里真正需要换车漆的材质名主要是 `Body_Color` 和 `Painted_Black`。

所以代码直接判断材质名：

```ts
const isBodyMesh = (mesh: THREE.Mesh) => {
  const material = getFirstMaterial(mesh.material)
  const materialName = (material?.name || '').toLowerCase().replace(/\.\d+$/, '')
  return materialName === 'body_color' || materialName === 'painted_black'
}
```

这比用 `paint / body / exterior` 这类关键词到处猜更可靠。玻璃、轮胎、刹车盘这些材质天然不会命中，后续排除条件也少很多。

## 状态如何对应按钮

交互按钮没有直接读 Three.js 对象的状态，而是用 Vue 的响应式状态保存：

```ts
const featureState = reactive({
  doors: false,
  hood: false,
  trunk: false,
  wheels: false,
  lights: false,
})
```

按钮负责切换状态，Three.js 负责根据状态执行对应动作。

比如车门：

```ts
const toggleDoors = () => {
  featureState.doors = !featureState.doors

  if (playAnimatedActions('doors', featureState.doors)) {
    return
  }

  parts.doors.forEach((part) => {
    const side = getObjectSide(part)
    animatePart(part, featureState.doors, { y: side === 'left' ? -0.92 : 0.92 })
  })
}
```

这段逻辑有两层：

1. 如果能播放 GLB 自带动画，就优先播放；
2. 如果没有对应动画，再使用 GSAP 旋转部件兜底。

按钮不需要知道模型内部细节，只需要知道当前是打开还是关闭。

## 清理也要升级

基础版已经讲过 Three.js 资源要手动清理。交互版额外多了 GSAP 补间和 AnimationMixer，所以销毁时也要一起处理：

```ts
transformSnapshots.forEach((_, object) => {
  gsap.killTweensOf(object.rotation)
  gsap.killTweensOf(object.position)
})

clearAnimationActions()
controls?.dispose()
```

如果不处理，页面切换后可能还残留补间、动画动作或 WebGL 资源。一次两次可能看不出问题，切换多了就容易出现内存占用上涨或者控制器状态异常。

## 交互版的真实难点

做到这里你会发现，交互版并不是多写几个按钮这么简单。

真正费时间的是确认模型结构：

```ts
model.traverse((object) => {
  if (object instanceof THREE.Mesh) {
    const material = getFirstMaterial(object.material)
    console.log(object.name, material?.name)
  }
})
```

你需要确认：

1. 哪些节点是车门；
2. 哪些节点是前备箱和后备箱；
3. 哪些节点是车轮；
4. 哪些材质是车身；
5. 哪些材质是灯光；
6. 动画片段的目标节点挂在哪个父级下面。

代码可以写得通用一点，但不能完全脱离模型。模型节点拆得好，交互就顺；模型节点全糊在一起，代码写得再努力也很难自然。

## 放在最后的话

第一版解决的是“车能不能展示出来”。

这一版解决的是“车能不能被用户操作”。

看起来只是多了几个按钮，背后其实换了一个思路：从渲染静态模型，变成管理模型部件、动画片段和用户状态。

第一版重点是场景、灯光、材质、相机和渲染循环。

这一版重点是节点结构、动画归类、pivot、按钮状态、兜底补间和控制器范围。

如果你只是想展示一个 3D 模型，第一版就够了。

如果你想做成产品配置器、车型展示页、虚拟展厅，那就必须进入这一版：不只是把模型画出来，还要知道它的每个部件能不能被控制。
