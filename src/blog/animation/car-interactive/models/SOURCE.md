# 汽车展示模型来源

## 当前使用模型：Chevrolet Corvette C8

- 模型名称：[Animated Chevrolet C8 Model](https://sketchfab.com/3d-models/animated-chevrolet-c8-model-91d39ff24d6c4e7b83674411f9c5bb67)
- 模型作者：[TechFusion](https://sketchfab.com/techfusion)
- 授权协议：[Creative Commons Attribution](http://creativecommons.org/licenses/by/4.0/)
- 使用说明：该模型使用 CC-BY 授权，使用时需要保留作者署名，协议允许商业使用。

项目中实际加载的 GLB 文件放在这里：

```text
src/views/animation/car-showcase/models/chevrolet-corvette-c8.glb
```

基础版和交互版都会通过下面这种方式加载本地模型：

```ts
new URL('./models/chevrolet-corvette-c8.glb', import.meta.url)
```

我检查过这个 GLB，里面大致包含 `238` 个节点、`72` 个 Mesh、`51` 个材质和 `7` 个动画片段。模型中能识别到一些有意义的部件名称，比如 `Left Door_122`、`Right Door_104`、`Frunk_69`、`Trunk [or Hood]_140`、`Roof_36`、车轮组和灯光相关材质。

需要注意的是，这个模型的动画片段名称比较泛，比如 `Object_239Action`，不能直接通过动画名称判断它控制的是车门还是前备箱。因此交互版代码不会依赖动画片段名称，而是读取动画目标节点，再沿着父级层级往上找，根据祖先节点名称把动画归类到车门、前备箱或后备箱。
