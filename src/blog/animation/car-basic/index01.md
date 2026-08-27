# 知道掘金兄弟们都喜欢跑车，所以必须安排上。

## 前言

最近研究了一下 `Three.js`, 立马想到了给兄弟们整点福利。

我替兄弟们试了，车是好车，开起来很丝滑，下面就带兄弟们体验一下。

## 如何 40 岁之前开上跑车？

![alt text](image.png)

大家小时候是不是都有一个跑车梦想，特别是看了速度与激情后，对美系肌肉车更感兴趣了，虽然很多人现在已经接近中登了，你的跑车梦实现了吗？

虽然跑车开不上，但是还有第二条路，做个模型欣赏一下还是可以的。

注意：这篇文章适合 Three.js 初学者，

## 介绍模型来源

在使用 Three.js 渲染 3D 产品之前，你需要先进行建模， Three.js 并不能凭空生成一辆结构完整、外观真实的汽车，它更像是一个 把 3D 模型渲染到浏览器里的引擎。

前端通常不会自己建模，而是使用设计师、3D 建模师或素材平台提供的 .glb / .gltf 模型。而我这里使用的模型如下：

[Animated Chevrolet C8 Model - Sketchfab](https://sketchfab.com/3d-models/animated-chevrolet-c8-model-91d39ff24d6c4e7b83674411f9c5bb67)

这个模型是 `CC Attribution` 授权，使用时需要保留作者署名。当前项目已经把运行时使用的 GLB 放到了当前案例的 `models` 文件夹下，模型和页面代码放在一起，方面后面小伙伴自取。

## 页面结构

这里的 DOM 结构非常简单：

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

`showcase-canvas` 只负责挂载 Three.js 生成的 canvas。车型标题、参数、按钮还是用普通 DOM 写。这样代码更清晰，布局也更好控制。

## 创建场景

Three.js 最核心的三个对象是：

```ts
scene = new THREE.Scene()
camera = new THREE.PerspectiveCamera(25, width / height, 0.1, 100)
renderer = new THREE.WebGLRenderer({ antialias: true })
```

可以这样理解：

1. `scene` 是 3D 世界；
2. `camera` 是观察这个世界的眼睛；
3. `renderer` 是把 3D 世界画成 canvas 的渲染器。

![Three.js 汽车展示渲染流程图](./render-flow.svg)

这张图可以按一句话理解：模型、灯光、展台和环境都放进 `scene`，`camera` 决定从哪里看，`renderer.render(scene, camera)` 负责把这一刻的 3D 世界画到页面里的 `canvas` 上。

初始化完成后，把 canvas 挂到 Vue 的容器里：

```ts
host.appendChild(renderer.domElement)
```

## 色彩空间和色调映射

代码里有几行很关键：

```ts
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 0.6
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

## 写在最后的话

车停浏览器里了，记得开走。
