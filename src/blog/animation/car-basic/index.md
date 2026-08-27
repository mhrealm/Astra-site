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

打印过 `mesh.name` 和 `material?.name` 后，可以看到这份 C8 模型里真正需要换车漆的材质名主要是 `Body_Color` 和 `Painted_Black`。

所以这里不用再通过 `paint/body/exterior` 这类关键词猜测，遍历 Mesh 时只看当前 Mesh 的材质名：

```ts
const isPaintMesh = (mesh: THREE.Mesh) => {
  const material = getFirstMaterial(mesh.material)
  const materialName = (material?.name || '').toLowerCase().replace(/\.\d+$/, '')
  return materialName === 'body_color' || materialName === 'painted_black'
}
```

这样玻璃、轮胎、刹车盘这些节点天然不会命中，判断会比关键词排除更稳定。

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
