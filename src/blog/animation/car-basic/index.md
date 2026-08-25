---
title: 'Vue + Three.js 实现 3D 汽车展示基础版'
description: '最近在做一个汽车 3D 产品展示案例，技术栈是 Vue 3 + Three.js 。'
pubDate: '2026-08-25'
category: '动画动效'
categorySlug: 'animation'
tags: ['Three.js', '动效']
difficulty: 4
source: 'vue-practice/src/views/animation/car-showcase/basic.md'
demoSlug: 'animation-car-showcase-basic'
---

## 前言

最近在做一个汽车 3D 产品展示案例，技术栈是 `Vue 3 + Three.js`。

模型来源：

[Animated Chevrolet C8 Model - Sketchfab](https://sketchfab.com/3d-models/animated-chevrolet-c8-model-91d39ff24d6c4e7b83674411f9c5bb67)

这个模型是 `CC Attribution` 授权，使用时需要保留作者署名。当前项目已经把运行时使用的 GLB 放到了当前案例的 `models` 文件夹下，模型和页面代码放在一起，后续移动、删除、写说明都会更直观。

初学 Three.js 的时候，先把这条主线跑通非常重要。因为后面的所有交互，其实都是建立在“模型已经被正确加载并组织好”这个基础上的。

## 页面结构

DOM 结构非常简单：

```vue
<template>
  <main class="car-showcase-page">
    <div ref="sceneHostRef" class="showcase-canvas"></div>

    <section class="showcase-copy">
      <!-- 车型文案 -->
    </section>

    <section class="paint-panel">
      <!-- 车漆色卡，默认第一个红色处于选中状态 -->
    </section>
  </main>
</template>
```

这里有一个重要思路：3D 归 3D，DOM 归 DOM。

`showcase-canvas` 只负责挂载 Three.js 生成的 canvas。车型标题、参数、按钮还是用普通 DOM 写。这样代码更清晰，布局也更好控制。

## 模型路径

代码里用了一个模型地址：

```ts
const corvetteModelUrl = new URL('./models/chevrolet-corvette-c8.glb', import.meta.url).href
```

`corvetteModelUrl` 指向当前组件旁边的 `models/chevrolet-corvette-c8.glb`。

为什么放在当前案例目录？

因为这个模型只服务于 `car-showcase` 这个案例，不是全站公共资源。放到当前案例目录后，Vite 会把它当成模块资源处理，最终构建时自动生成正确的资源地址。

写法是：

```ts
new URL('./models/chevrolet-corvette-c8.glb', import.meta.url)
```

这种写法的好处是路径跟着文件走。以后如果把整个 `car-showcase` 文件夹移动到别处，模型路径也不容易散。

目录结构大致是：

```text
car-showcase/
├─ basic.vue
├─ interactive.vue
└─ models/
   └─ chevrolet-corvette-c8.glb
```

这样模型资源不会混到 `public` 里。

## 加载模型

基础版的加载逻辑是：

```ts
const loadCarModel = async () => {
  const loader = new GLTFLoader()
  const gltf = await loader.loadAsync(corvetteModelUrl)
}
```

现在代码直接加载 C8。因为模型已经进入案例目录，继续保留备用模型反而会让主线变复杂。

如果模型加载失败，代码会把提示写入 `modelNote`，页面上会出现错误信息。基础版这里不做备用模型，目的是让教程主线更干净：先把真实 GLB 模型加载、适配、换色这几件事讲清楚。

## 创建场景

Three.js 最核心的三个对象是：

```ts
scene = new THREE.Scene()
camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100)
renderer = new THREE.WebGLRenderer({ antialias: true })
```

可以这样理解：

1. `scene` 是 3D 世界；
2. `camera` 是观察这个世界的眼睛；
3. `renderer` 是把 3D 世界画成 canvas 的渲染器。

初始化完成后，把 canvas 挂到 Vue 的容器里：

```ts
host.appendChild(renderer.domElement)
```

## 色彩空间和色调映射

代码里有几行很关键：

```ts
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 0.7
```

`outputColorSpace` 会影响颜色在浏览器里的显示。如果不处理，模型颜色可能偏灰或者不准。

`toneMapping` 可以理解成把 3D 渲染中的高光和暗部映射成屏幕上更舒服的颜色。汽车展示很依赖高光，所以这里用了 `ACESFilmicToneMapping`。

`toneMappingExposure` 是曝光值。过高会让车漆高光炸白，过低又会显得没质感，所以这里设置得比较克制。

## 环境反射

汽车车漆是否真实，很大程度取决于反射。

基础版使用 `RoomEnvironment` 生成环境贴图：

```ts
const pmremGenerator = new THREE.PMREMGenerator(renderer)
environmentMap = pmremGenerator.fromScene(new RoomEnvironment(), 0.04)
scene.environment = environmentMap.texture
pmremGenerator.dispose()
```

`scene.environment` 可以理解成“周围环境的反光来源”。

车漆、玻璃、金属这些材质都会从环境贴图里拿到反射信息。如果没有它，车身会显得很平，像普通彩色模型。

## 展台和初始镜头

基础版现在只保留网格参考线：

```ts
const grid = new THREE.GridHelper(18, 36, '#475569', '#1f2937')
grid.position.y = 0.018
scene?.add(grid)
```

`GridHelper` 画出来的是线条，不是实心地板。这样既能保留空间方向，又不会出现车底下面一整块黑色平面。

之前外面有一个白色光圈，本质上是用 `TorusGeometry` 画出来的圆环：

```ts
new THREE.TorusGeometry(3.45, 0.018, 12, 128)
```

这个圆环视觉存在感比较强，会抢走车本身的注意力，所以现在基础版和交互版都删除了它，只保留网格。

初始镜头也稍微靠近了一点：

```ts
camera.position.set(5.15, 2.55, 4.85)
controls.target.set(0, 0.82, 0)
```

`camera.position.set(x, y, z)` 可以理解成把相机放到 3D 空间里的某个位置。

当前这组值表示：相机在车的右前上方，看向车身中心附近。相比更远的镜头，汽车初始状态会更大一些，更像产品展示页。

## 模型适配展台

不同来源的 3D 模型尺寸差别很大，有的按米建模，有的按厘米建模，原点也不一定在车身中心。

所以加载模型后，要统一做三件事：

```ts
const box = new THREE.Box3().setFromObject(model)
const size = box.getSize(new THREE.Vector3())
const maxSize = Math.max(size.x, size.y, size.z)

model.scale.setScalar(5.4 / maxSize)
```

第一步：用 `Box3` 获取模型包围盒。

第二步：根据最长边把模型缩放到合适大小。

第三步：居中并贴地：

```ts
const centeredBox = new THREE.Box3().setFromObject(model)
const center = centeredBox.getCenter(new THREE.Vector3())
model.position.sub(center)

const finalBox = new THREE.Box3().setFromObject(model)
model.position.y -= finalBox.min.y
```

这样无论原模型大小如何，都能比较稳定地放进当前展台。

## 车漆材质

汽车车漆不能简单地用纯色覆盖。

如果直接这样写：

```ts
new THREE.MeshPhysicalMaterial({
  color: '#9b171b',
})
```

车身很容易变成一整块塑料。

更好的方式是基于原模型材质创建新材质，并尽量保留原始贴图：

```ts
const material = new THREE.MeshPhysicalMaterial({
  color: paint.color,
  map: source?.map || null,
  metalnessMap: source?.metalnessMap || null,
  roughnessMap: source?.roughnessMap || null,
  normalMap: source?.normalMap || null,
  aoMap: source?.aoMap || null,
  transparent: false,
  opacity: 1,
})

applyCarPaintToMaterial(material, paint)
```

这里几个参数可以简单理解为：

1. `metalness`：金属感；
2. `roughness`：粗糙度；
3. `clearcoat`：清漆层；
4. `clearcoatRoughness`：清漆层粗糙度；
5. `envMapIntensity`：环境反射强度。

汽车漆面不是纯金属，也不是纯塑料，而是底色上覆盖一层清漆。所以 `clearcoat` 对车漆质感很重要。

车漆的具体参数放在 `paintOptions` 里：

```ts
const activePaint = ref('corvette-red')

const paintOptions: PaintOption[] = [
  {
    name: 'corvette-red',
    label: 'Corvette Red',
    color: '#8f1418',
    metalness: 0.16,
    roughness: 0.22,
  },
  {
    name: 'ceramic-white',
    label: 'Ceramic White',
    color: '#98a3ad',
    metalness: 0.05,
    roughness: 0.43,
  },
  {
    name: 'blade-silver',
    label: 'Blade Silver',
    color: '#b5bec7',
    metalness: 0.28,
    roughness: 0.2,
  },
  { name: 'night-black', label: 'Night Black', color: '#05070a', metalness: 0.14, roughness: 0.18 },
]
```

这里故意把红色放在第一个，同时让 `activePaint` 默认等于 `corvette-red`。这样页面打开时，默认车漆和第一个色卡是对应的。

## 如何识别车身？

模型内部节点名不一定统一，所以代码用了关键词判断：

```ts
const paintKeywords = ['paint', 'body', 'carpaint', 'car_paint', 'exterior', 'corvette', 'c8']
const ignorePaintKeywords = [
  'glass',
  'window',
  'tire',
  'tyre',
  'rubber',
  'rim',
  'wheel',
  'light',
  'lamp',
]
```

遍历 Mesh 时，把节点名和材质名拼起来：

```ts
const text = `${mesh.name} ${material?.name || ''}`.toLowerCase()
```

如果命中 `paint/body/exterior`，同时没有命中 `glass/wheel/light`，就把它当成车身。

这种方式不是绝对完美，但对教学案例很友好。真实项目里，最好还是下载模型后打印节点树，再按实际节点名精确匹配。

## 切换车漆

色卡点击后不重新加载模型，只更新当前共用的车身材质：

```ts
const applyPaint = (paint: PaintOption) => {
  activePaint.value = paint.name

  if (bodyMaterial) {
    applyCarPaintToMaterial(bodyMaterial, paint)
  }
}
```

这里没有重新加载模型，也没有重新创建材质。

因为所有车身 Mesh 都共用同一个 `bodyMaterial`，所以只要改这一份材质，整辆车的车身都会同步变化。

注意这里更新的不只是 `color`，还会同步更新：

1. `metalness`；
2. `roughness`；
3. `clearcoatRoughness`；
4. `reflectivity`；
5. `envMapIntensity`；
6. `iridescence`。

这样不同颜色可以有不同质感。比如红色更亮、更有清漆反射；白色则更克制，避免看起来过曝。

## 渲染循环

Three.js 动画依赖 `requestAnimationFrame`：

```ts
const renderScene = () => {
  carGroup?.rotateY(0.002)
  controls?.update()
  renderer.render(scene, camera)

  animationFrameId = window.requestAnimationFrame(renderScene)
}
```

每一帧做三件事：

1. 让整车轻微自转；
2. 更新 OrbitControls 的阻尼；
3. 渲染当前画面。

`controls.enableDamping = true` 后，必须每帧调用 `controls.update()`，否则拖拽缓动不会生效。

## 资源清理

Three.js 资源不会随着 Vue 组件销毁自动释放。

所以卸载时需要处理：

```ts
window.cancelAnimationFrame(animationFrameId)
window.removeEventListener('resize', handleResize)
controls?.dispose()
disposeObject(scene)
environmentMap?.dispose()
renderer?.dispose()
renderer?.domElement.remove()
```

其中 `disposeObject` 会遍历场景里的 Mesh，释放几何体和材质：

```ts
object.traverse((child) => {
  if (!(child instanceof THREE.Mesh)) {
    return
  }

  child.geometry.dispose()
  disposeMaterial(child.material, disposedMaterials)
})
```

在 SPA 项目里，这一步非常重要。否则来回切换路由后，WebGL 资源可能一直留在内存里。

## 放在最后的话

基础版看起来只是“加载一辆车”，但里面已经包含了 Three.js 产品展示的核心判断：

为什么模型路径要考虑构建？

为什么加载后要重新计算尺寸？

为什么车漆不能简单替换成纯色？

为什么环境反射比多加几盏灯更重要？

为什么离开页面时还要手动释放资源？

AI 可以很快生成一段能跑的 Three.js 代码，但能不能把它改成业务真正需要的样子，还是取决于我们是否理解这些细节。

基础版解决“车能不能稳定展示”的问题。

交互版再解决“车能不能被用户操作”的问题。
