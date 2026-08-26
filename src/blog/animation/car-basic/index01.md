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

## 初始化 Three.js

## 写在最后的话

车停浏览器里了，记得开走。
