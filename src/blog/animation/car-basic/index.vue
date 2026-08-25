<template>
  <main class="car-showcase-page">
    <!-- Three.js 生成的 canvas 会挂到这个容器里，Vue 只负责提供一个稳定的 DOM 挂载点。 -->
    <div ref="sceneHostRef" class="showcase-canvas"></div>

    <!-- 普通页面文案继续交给 DOM/CSS 处理，3D 场景只负责车和展台。 -->
    <section class="showcase-copy" aria-label="产品信息">
      <p>{{ modelKicker }}</p>
      <h1>Chevrolet Corvette C8</h1>

      <dl>
        <div>
          <dt>Engine</dt>
          <dd>LT2 V8</dd>
        </div>
        <div>
          <dt>Power</dt>
          <dd>495hp</dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd>Mid-engine</dd>
        </div>
      </dl>

      <span v-if="modelNote" class="model-note">
        {{ modelNote }}
      </span>
    </section>

    <!-- 基础版只保留车漆切换，让初学者先看懂“加载模型 + 替换材质”这条主线。 -->
    <section class="paint-panel" aria-label="车漆颜色">
      <button
        v-for="paint in paintOptions"
        :key="paint.name"
        type="button"
        class="paint-swatch"
        :class="{ 'paint-swatch--active': activePaint === paint.name }"
        :style="{ backgroundColor: paint.color }"
        :aria-label="paint.label"
        :aria-pressed="activePaint === paint.name"
        @click="applyPaint(paint)"
      ></button>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue' // 引入 Vue 生命周期和 ref，用来挂载/卸载 Three.js 场景。
import * as THREE from 'three' // 引入 Three.js 主包，场景、相机、材质、灯光都从这里创建。
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js' // 引入轨道控制器，让用户可以拖拽旋转查看模型。
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js' // 引入 glTF/GLB 加载器，用来加载汽车模型文件。
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js' // 引入内置房间环境，用来生成车漆反射所需的环境贴图。
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js' // 引入矩形区域光初始化工具，让 RectAreaLight 可以正确照亮 PBR 材质。

interface PaintOption {
  // 定义每个车漆色卡需要保存的数据结构。
  name: string // 程序内部使用的唯一标识，点击色卡时用它判断是否选中。
  label: string // 色卡的可读名称，主要给 aria-label 和读屏软件使用。
  color: string // 色卡颜色，也是车身材质的基础颜色。
  metalness: number // 金属度，数值越高越像金属。
  roughness: number // 粗糙度，数值越低高光越锐利，数值越高反射越柔。
  clearcoatRoughness: number // 清漆层粗糙度，用来控制车漆表面高光是否干净。
  reflectivity: number // 反射强度，用来控制清漆层对环境的反射程度。
  envMapIntensity: number // 环境贴图强度，直接影响车漆是否有明显摄影棚高光。
  pearl: number // 珠光/虹彩强度，用少量数值模拟车漆里的细微变色层。
}

const corvetteModelUrl = new URL('./models/chevrolet-corvette-c8.glb', import.meta.url).href // 获取 GLB 模型在开发和打包后的真实访问地址。
const sceneHostRef = ref<HTMLDivElement>() // 保存 Three.js canvas 要挂载到的 DOM 容器。

const activePaint = ref('corvette-red') // 记录当前选中的车漆，默认使用红色。
const modelNote = ref('') // 保存模型加载失败等提示文案，空字符串表示不展示提示。
const modelKicker = 'Animated Sports Car Showcase' // 页面左上角的小标题文案。

const paintOptions: PaintOption[] = [
  // 车漆配置列表，色值和 PBR 参数一起控制最终车漆质感。
  {
    name: 'corvette-red',
    label: 'Corvette Red',
    color: '#8f1418',
    metalness: 0.16,
    roughness: 0.22,
    clearcoatRoughness: 0.03,
    reflectivity: 0.68,
    envMapIntensity: 1.36,
    pearl: 0.04,
  }, // 红色车漆配置，作为默认展示颜色。
  {
    name: 'ceramic-white',
    label: 'Ceramic White',
    color: '#98a3ad',
    metalness: 0.05,
    roughness: 0.43,
    clearcoatRoughness: 0.09,
    reflectivity: 0.28,
    envMapIntensity: 0.58,
    pearl: 0.02,
  }, // 陶瓷白车漆配置，降低亮度避免过白。
  {
    name: 'blade-silver',
    label: 'Blade Silver',
    color: '#b5bec7',
    metalness: 0.28,
    roughness: 0.2,
    clearcoatRoughness: 0.028,
    reflectivity: 0.7,
    envMapIntensity: 1.42,
    pearl: 0.1,
  }, // 银色车漆配置，金属感和环境反射更强。
  {
    name: 'night-black',
    label: 'Night Black',
    color: '#05070a',
    metalness: 0.14,
    roughness: 0.18,
    clearcoatRoughness: 0.026,
    reflectivity: 0.74,
    envMapIntensity: 1.58,
    pearl: 0.02,
  }, // 黑色车漆配置，依赖高反射表现轮廓。
]

let scene: THREE.Scene | null = null // Three.js 场景，所有模型、灯光、网格都添加到这里。
let camera: THREE.PerspectiveCamera | null = null // 透视相机，决定用户从哪个位置和角度看 3D 场景。
let renderer: THREE.WebGLRenderer | null = null // WebGL 渲染器，负责把 scene + camera 画到 canvas 上。
let controls: OrbitControls | null = null // 轨道控制器，负责鼠标拖拽旋转、缩放等交互。
let carGroup: THREE.Group | null = null // 整车外层分组，自动旋转时只转这个 Group。
let bodyMaterial: THREE.MeshPhysicalMaterial | null = null // 当前车身共用材质，点击色卡时直接修改它。
let environmentMap: THREE.WebGLRenderTarget | null = null // PMREM 生成的环境贴图渲染目标，卸载时需要释放。
let animationFrameId = 0 // requestAnimationFrame 的 id，用来在组件卸载时停止渲染循环。

const paintKeywords = ['paint', 'body', 'carpaint', 'car_paint', 'exterior', 'corvette', 'c8'] // 用来判断某个 Mesh 是否可能是车身漆面。
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
] // 排除玻璃、轮胎、灯光等不应该换车漆的 Mesh。

const getHostSize = () => {
  // 获取 Three.js 容器尺寸，初始化和窗口变化时都会用到。
  const host = sceneHostRef.value // 读取 Vue 模板里绑定的 DOM 容器。

  return {
    // 返回渲染器和相机需要的宽高。
    width: host?.clientWidth || window.innerWidth, // 优先使用容器宽度，没有容器时退回窗口宽度。
    height: host?.clientHeight || window.innerHeight, // 优先使用容器高度，没有容器时退回窗口高度。
  }
}

const includesAny = (value: string, keywords: string[]) =>
  keywords.some((keyword) => value.includes(keyword)) // 判断字符串是否包含任意一个关键词。

const getFirstMaterial = (material: THREE.Material | THREE.Material[]) => {
  // glTF 的 Mesh 可能是单材质，也可能是材质数组，这里统一取第一项。
  return Array.isArray(material) ? material[0] : material // 如果是数组就取第一个，否则直接返回当前材质。
}

const getActivePaint = () =>
  paintOptions.find((paint) => paint.name === activePaint.value) || paintOptions[0]! // 根据 activePaint 找当前车漆配置，找不到时兜底第一个。

const applyCarPaintToMaterial = (material: THREE.MeshPhysicalMaterial, paint: PaintOption) => {
  // 把某个车漆配置写入 MeshPhysicalMaterial。
  material.color.set(paint.color) // 设置车漆基础色。
  material.metalness = paint.metalness // 设置金属度，汽车漆通常只保留少量金属感。
  material.roughness = paint.roughness // 设置粗糙度，控制高光锐利程度。
  material.clearcoat = 1 // 开启完整清漆层，让车漆表面有额外反射。
  material.clearcoatRoughness = paint.clearcoatRoughness // 设置清漆层粗糙度，控制清漆高光是否干净。
  material.reflectivity = paint.reflectivity // 设置反射强度，让车漆能反射环境。
  material.ior = 1.55 // 设置折射率，影响清漆层的反射表现。
  material.specularIntensity = 1 // 设置高光强度，让车漆有明确的镜面高光。
  material.specularColor.set('#ffffff') // 设置高光颜色为白色，模拟摄影棚灯光反射。
  material.envMapIntensity = paint.envMapIntensity // 设置环境贴图反射强度，影响车身亮面层次。
  material.iridescence = paint.pearl // 设置珠光强度，少量数值让车漆不那么死板。
  material.iridescenceIOR = 1.32 // 设置虹彩层折射率，配合珠光效果使用。
  material.iridescenceThicknessRange = [120, 360] // 设置虹彩层厚度范围，控制变色层的细微变化。
  material.needsUpdate = true // 通知 Three.js 材质参数变了，需要重新更新渲染。
}

const createBodyMaterial = (sourceMaterial: THREE.Material, paint: PaintOption) => {
  // 根据原模型材质创建一个新的车身物理材质。
  const source = sourceMaterial instanceof THREE.MeshStandardMaterial ? sourceMaterial : null // 只有标准/PBR 材质才安全读取贴图字段。

  const material = new THREE.MeshPhysicalMaterial({
    // 创建支持 clearcoat 的物理材质，更适合表现汽车车漆。
    color: paint.color, // 设置初始基础色。
    map: source?.map || null, // 复用原材质颜色贴图，保留模型细节。
    metalnessMap: source?.metalnessMap || null, // 复用原材质金属度贴图。
    roughnessMap: source?.roughnessMap || null, // 复用原材质粗糙度贴图。
    normalMap: source?.normalMap || null, // 复用原材质法线贴图，保留表面凹凸细节。
    aoMap: source?.aoMap || null, // 复用原材质环境遮蔽贴图，保留暗部层次。
    transparent: false, // 车身不需要透明。
    opacity: 1, // 设置完全不透明。
  })

  material.name = 'c8-showcase-paint' // 给新材质命名，方便调试时识别。
  applyCarPaintToMaterial(material, paint) // 把当前车漆配置完整写入新材质。

  return material // 返回创建好的车身材质。
}

const isPaintMesh = (mesh: THREE.Mesh) => {
  // 判断当前 Mesh 是否应该被当成车身漆面处理。
  const material = getFirstMaterial(mesh.material) // 获取当前 Mesh 的第一个材质。
  const text = `${mesh.name} ${material?.name || ''}`.toLowerCase() // 拼出 mesh 名和材质名，统一转小写做关键词匹配。

  return includesAny(text, paintKeywords) && !includesAny(text, ignorePaintKeywords) // 命中车漆关键词且没有命中排除关键词，才认为是车身。
}

const isModelBaseMesh = (mesh: THREE.Mesh) => {
  // 判断模型自带的展示底座/平面，基础版里不需要它。
  const material = getFirstMaterial(mesh.material) // 获取当前 Mesh 的第一个材质。
  const text = `${mesh.name} ${material?.name || ''}`.toLowerCase() // 拼出 mesh 名和材质名，统一转小写做判断。

  return text.includes('plane') || text.includes('material.052') // 命中 plane 或特定底座材质名，就认为是模型底座。
}

const prepareCarModel = (model: THREE.Object3D) => {
  // 遍历模型，隐藏底座、开启阴影、替换车身材质。
  const currentPaint = getActivePaint() // 获取当前选中的车漆配置。

  model.traverse((object) => {
    // 递归遍历模型对象树。
    if (!(object instanceof THREE.Mesh)) {
      // 只处理真正可渲染的 Mesh。
      return // 不是 Mesh 的节点直接跳过。
    }

    object.castShadow = true // 允许当前 Mesh 投射阴影。
    object.receiveShadow = true // 允许当前 Mesh 接收阴影。

    if (isModelBaseMesh(object)) {
      // 如果是模型自带底座，就隐藏掉。
      object.visible = false // 不渲染这个底座 Mesh。
      return // 底座已经处理完，跳过后续逻辑。
    }

    if (isPaintMesh(object)) {
      // 如果当前 Mesh 是车身漆面，就替换成统一车漆材质。
      const sourceMaterial = getFirstMaterial(object.material) // 读取原始材质，用来复用贴图。

      if (!sourceMaterial) {
        // 极端情况下材质为空，就不继续处理。
        return // 没有材质无法创建车漆，直接跳过。
      }

      bodyMaterial = bodyMaterial || createBodyMaterial(sourceMaterial, currentPaint) // 创建一次车身材质，后续所有车身 Mesh 共用它。
      object.material = bodyMaterial // 把当前车身 Mesh 的材质替换成统一车漆材质。
    }
  })
}

const applyInitialAnimationPose = (model: THREE.Object3D, animations: THREE.AnimationClip[]) => {
  // 把模型自带动画压到闭合帧，避免基础展示页一开始车门/机盖是打开的。
  if (!animations.length) {
    // 如果模型没有动画片段，就不需要处理。
    return // 直接结束。
  }

  const mixer = new THREE.AnimationMixer(model) // 创建动画混合器，用来应用 glTF 里的动画片段。
  let closeTime = 0 // 记录所有动画片段里最长的时间，C8 的末帧是闭合状态。

  animations.forEach((clip) => {
    // 遍历模型里的每个动画片段。
    const action = mixer.clipAction(clip) // 为当前动画片段创建可播放的 AnimationAction。
    closeTime = Math.max(closeTime, clip.duration) // 取最大动画时长，后面直接跳到这一帧。
    action.setLoop(THREE.LoopOnce, 1) // 让动画只播放一次。
    action.clampWhenFinished = true // 播放结束后停留在最后一帧。
    action.play() // 激活动画动作，让 mixer.setTime 可以应用它。
  })

  mixer.setTime(closeTime) // 把所有动画直接推进到末帧，让车辆处于闭合展示状态。
}

const fitModelToStage = (model: THREE.Object3D) => {
  // 统一模型尺寸、中心点和贴地位置，让不同来源的模型能稳定放进场景。
  const box = new THREE.Box3().setFromObject(model) // 根据模型当前状态计算包围盒。
  const size = box.getSize(new THREE.Vector3()) // 读取包围盒宽高深。
  const maxSize = Math.max(size.x, size.y, size.z) // 找出模型最大的一个尺寸，用来等比缩放。

  model.scale.setScalar(5.4 / maxSize) // 按最大尺寸把模型缩放到适合当前舞台的大小。

  const centeredBox = new THREE.Box3().setFromObject(model) // 缩放后重新计算包围盒。
  const center = centeredBox.getCenter(new THREE.Vector3()) // 获取模型中心点。
  model.position.sub(center) // 把模型中心移动到世界原点附近。

  const finalBox = new THREE.Box3().setFromObject(model) // 居中后再次计算包围盒。
  model.position.y -= finalBox.min.y // 把模型底部抬到 y=0，让车贴在网格上。
}

const loadCarModel = async () => {
  // 异步加载 GLB 汽车模型，并把它放进 Three.js 场景。
  try {
    // 捕获加载失败，避免页面直接崩掉。
    const loader = new GLTFLoader() // 创建 GLB/glTF 加载器。
    const gltf = await loader.loadAsync(corvetteModelUrl) // 根据模型 URL 异步加载模型资源。
    const model = gltf.scene // 取出 glTF 文件里的主场景对象，也就是整车对象树。

    if (!scene) {
      // 如果加载过程中组件已经卸载，scene 会被清空。
      disposeObject(model) // 释放刚加载出来但不会使用的模型资源。
      return // 不再继续往已销毁的场景里添加对象。
    }

    applyInitialAnimationPose(model, gltf.animations) // 把模型自带动画应用到闭合展示状态。
    prepareCarModel(model) // 处理模型材质、阴影和底座隐藏。
    fitModelToStage(model) // 缩放、居中、贴地模型。

    carGroup = new THREE.Group() // 创建整车外层 Group，方便整体旋转。
    carGroup.add(model) // 把处理好的模型放进 Group。
    carGroup.rotation.y = -0.52 // 设置初始朝向，让车头角度更适合展示。
    scene.add(carGroup) // 把整车 Group 加入场景。
  } catch (error) {
    // 模型加载失败时进入这里。
    modelNote.value = '模型加载失败，请检查模型文件路径。' // 给页面显示错误提示。
    console.error('Failed to load car model:', error) // 在控制台输出具体错误，方便调试。
  }
}

const createStage = () => {
  // 创建基础展示用的网格参考线。
  const grid = new THREE.GridHelper(18, 36, '#475569', '#1f2937') // 创建网格辅助线，第一个参数是尺寸，第二个参数是分段数。

  grid.position.y = 0.018 // 把网格稍微抬高，避免和模型底部重合闪烁。

  scene?.add(grid) // 如果场景存在，就把网格加入场景。
}

const createStudioLights = () => {
  // 创建两盏矩形柔光，用来模拟摄影棚灯箱反射。
  const frontSoftbox = new THREE.RectAreaLight('#ffffff', 0.95, 4.6, 1.5) // 创建前方白色矩形柔光。
  const sideSoftbox = new THREE.RectAreaLight('#dbeafe', 0.45, 3.8, 1.4) // 创建侧后方偏冷色矩形柔光。

  frontSoftbox.position.set(-2.4, 3.2, 4.4) // 设置前方柔光位置。
  sideSoftbox.position.set(4.3, 2.4, -2.6) // 设置侧方柔光位置。
  frontSoftbox.lookAt(0, 0.82, 0) // 让前方柔光照向车辆中心。
  sideSoftbox.lookAt(0, 0.82, 0) // 让侧方柔光照向车辆中心。

  scene?.add(frontSoftbox, sideSoftbox) // 如果场景存在，就把两盏矩形柔光加入场景。
}

const initScene = () => {
  // 初始化 Three.js 场景、相机、渲染器、灯光和控制器。
  const host = sceneHostRef.value! // 读取 canvas 容器，当前函数只在 onMounted 后调用，所以这里断言它存在。
  const { width, height } = getHostSize() // 获取容器宽高，用来设置相机比例和渲染器尺寸。

  scene = new THREE.Scene() // 创建 Three.js 场景，模型、灯光和网格都会放到这里。
  scene.background = new THREE.Color('#090d12') // 设置场景背景色。
  scene.fog = new THREE.Fog('#090d12', 10, 24) // 添加雾效，让远处背景和模型过渡更自然。

  camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100) // 创建透视相机，参数依次是视角、宽高比、近裁剪面、远裁剪面。
  camera.position.set(5.15, 2.55, 4.85) // 把相机放到车辆右前上方。

  renderer = new THREE.WebGLRenderer({ antialias: true }) // 创建 WebGL 渲染器，antialias 开启后模型边缘会更平滑。
  renderer.setSize(width, height) // 设置 canvas 的绘制尺寸，让 3D 画面铺满当前容器。
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // 适配高清屏，同时限制最大像素比为 2，避免分辨率过高拖慢渲染。
  renderer.outputColorSpace = THREE.SRGBColorSpace // 使用 sRGB 输出颜色空间，让颜色更接近浏览器和图片里的正常观感。
  renderer.toneMapping = THREE.ACESFilmicToneMapping // 使用 ACES 色调映射，让高光和暗部过渡更自然。
  renderer.toneMappingExposure = 0.7 // 控制整体曝光，数值越大画面越亮，这里压低一点避免车漆过曝。
  renderer.shadowMap.enabled = true // 开启阴影系统，模型和灯光的 castShadow / receiveShadow 才会生效。
  renderer.shadowMap.type = THREE.PCFSoftShadowMap // 使用柔和阴影，让阴影边缘没有默认阴影那么硬。
  host.appendChild(renderer.domElement) // renderer.domElement 是 Three.js 创建的 canvas，把它插入到 Vue 容器里。
  RectAreaLightUniformsLib.init() // 初始化 RectAreaLight 所需的 shader 支持，后面的矩形柔光才能正确工作。

  const pmremGenerator = new THREE.PMREMGenerator(renderer) // 创建 PMREM 生成器，把环境转换成适合 PBR 反射的贴图。
  environmentMap = pmremGenerator.fromScene(new RoomEnvironment(), 0.04) // 从内置房间环境生成环境贴图。
  scene.environment = environmentMap.texture // 把环境贴图挂到场景上，让金属、玻璃、车漆可以反射它。
  pmremGenerator.dispose() // PMREM 生成器只在生成贴图时需要，用完立即释放。

  controls = new OrbitControls(camera, renderer.domElement) // 创建轨道控制器，把相机和 canvas 绑定起来。
  controls.enableDamping = true // 开启阻尼，让拖拽旋转有惯性，手感更柔和。
  controls.enablePan = false // 禁止平移，避免用户把汽车拖出画面中心。
  controls.minDistance = 4 // 限制最近缩放距离，避免相机贴得太近。
  controls.maxDistance = 9 // 限制最远缩放距离，避免汽车变得太小。
  controls.maxPolarAngle = Math.PI / 2.05 // 限制相机往下绕到地面以下。
  controls.target.set(0, 0.82, 0) // 设置控制器观察目标，大致对准车辆车身中心。

  const keyLight = new THREE.DirectionalLight('#ffffff', 1.45) // 创建主方向光，负责照亮车身主要亮面。
  const fillLight = new THREE.DirectionalLight('#f8fafc', 0.28) // 创建补光，给暗部一点层次。
  const rimLight = new THREE.PointLight('#ffffff', 14, 12) // 创建轮廓点光，把汽车从深色背景里分离出来。
  const ambientLight = new THREE.HemisphereLight('#f8fafc', '#020617', 0.5) // 创建半球环境光，给场景提供基础亮度。

  keyLight.position.set(4.2, 7.4, 5.4) // 设置主光位置。
  keyLight.castShadow = true // 允许主光产生阴影。
  keyLight.shadow.mapSize.set(2048, 2048) // 设置阴影贴图分辨率，越高阴影越细腻但越耗性能。
  fillLight.position.set(-5, 4.2, -5) // 设置补光位置。
  rimLight.position.set(-3.8, 1.7, -3) // 设置轮廓光位置。

  scene.add(keyLight, fillLight, rimLight, ambientLight) // 把基础灯光加入场景。

  createStudioLights() // 创建矩形摄影棚柔光。
  createStage() // 创建网格展台。
  void loadCarModel() // 异步加载汽车模型，void 表示这里不等待 Promise 返回。
}

const applyPaint = (paint: PaintOption) => {
  // 点击色卡时切换车漆。
  activePaint.value = paint.name // 更新当前选中色卡状态。

  if (bodyMaterial) {
    // 只有模型加载并创建了车身材质后，才需要同步材质参数。
    applyCarPaintToMaterial(bodyMaterial, paint) // 把新车漆参数写到共用车身材质上。
  }
}

const renderScene = () => {
  // 每一帧执行一次，更新控制器、旋转车辆并重新渲染画面。
  if (!renderer || !scene || !camera) {
    // 渲染所需对象缺任意一个，都不能继续画。
    return // 直接退出当前帧。
  }

  carGroup?.rotateY(0.002) // 让整车轻微自转，基础展示页更有产品展示感。
  controls?.update() // 更新 OrbitControls，阻尼效果需要每帧调用。
  renderer.render(scene, camera) // 用当前相机视角把场景画到 canvas 上。

  animationFrameId = window.requestAnimationFrame(renderScene) // 请求下一帧，形成持续渲染循环。
}

const handleResize = () => {
  // 浏览器窗口或容器尺寸变化时，同步更新相机和渲染器。
  if (!camera || !renderer) {
    // 相机或渲染器还没初始化时不处理。
    return // 直接退出。
  }

  const { width, height } = getHostSize() // 重新读取容器最新宽高。

  camera.aspect = width / height // 更新相机宽高比，避免画面被拉伸。
  camera.updateProjectionMatrix() // 相机参数变化后必须更新投影矩阵。
  renderer.setSize(width, height) // 更新 canvas 绘制尺寸。
}

const disposeMaterial = (
  material: THREE.Material | THREE.Material[],
  disposedMaterials: Set<THREE.Material>,
) => {
  // 释放一个材质或一组材质，避免重复 dispose。
  const materials = Array.isArray(material) ? material : [material] // 统一转成数组，方便后面遍历。

  materials.forEach((item) => {
    // 遍历每一个材质。
    if (disposedMaterials.has(item)) {
      // 如果这个材质已经释放过，就不重复处理。
      return // 跳过当前材质。
    }

    item.dispose() // 释放材质占用的 GPU 资源。
    disposedMaterials.add(item) // 记录已释放材质，避免共享材质被重复释放。
  })
}

const disposeObject = (object: THREE.Object3D) => {
  // 递归释放一个 Object3D 下面的几何体和材质。
  const disposedGeometries = new Set<THREE.BufferGeometry>() // 记录已释放的几何体，避免重复释放。
  const disposedMaterials = new Set<THREE.Material>() // 记录已释放的材质，避免重复释放。

  object.traverse((child) => {
    // 递归遍历对象树里的所有子节点。
    if (!(child instanceof THREE.Mesh)) {
      // 只有 Mesh 才有 geometry 和 material。
      return // 非 Mesh 节点直接跳过。
    }

    if (!disposedGeometries.has(child.geometry)) {
      // 如果这个几何体还没有释放过。
      child.geometry.dispose() // 释放几何体占用的 GPU 资源。
      disposedGeometries.add(child.geometry) // 记录已释放几何体。
    }

    disposeMaterial(child.material, disposedMaterials) // 释放当前 Mesh 使用的材质。
  })
}

const disposeScene = () => {
  // 组件卸载时清理 Three.js 场景和浏览器事件。
  window.cancelAnimationFrame(animationFrameId) // 停止 requestAnimationFrame 渲染循环。
  window.removeEventListener('resize', handleResize) // 移除窗口尺寸变化监听，避免组件卸载后还触发回调。

  controls?.dispose() // 释放 OrbitControls 绑定的鼠标/触摸事件。

  if (scene) {
    // 如果场景还存在，就释放场景里所有 Mesh 资源。
    disposeObject(scene) // 释放场景对象树里的 geometry 和 material。
  }

  environmentMap?.dispose() // 释放环境贴图渲染目标。
  renderer?.dispose() // 释放渲染器内部资源。
  renderer?.domElement.remove() // 从 DOM 中移除 Three.js 创建的 canvas。

  scene = null // 清空场景引用，方便垃圾回收。
  camera = null // 清空相机引用。
  renderer = null // 清空渲染器引用。
  controls = null // 清空控制器引用。
  carGroup = null // 清空汽车 Group 引用。
  bodyMaterial = null // 清空车身材质引用。
  environmentMap = null // 清空环境贴图引用。
}

onMounted(() => {
  // Vue 组件挂载完成后，DOM ref 已经可以拿到真实元素。
  initScene() // 初始化 Three.js 场景。
  window.addEventListener('resize', handleResize) // 监听窗口变化，让 canvas 和相机尺寸同步更新。
  renderScene() // 启动渲染循环。
})

onBeforeUnmount(disposeScene) // 组件卸载前释放 Three.js 资源和事件监听。
</script>

<style scoped lang="less">
.car-showcase-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: #090d12;
  color: #f8fafc;
}

.showcase-canvas {
  position: absolute;
  inset: 0;
}

.showcase-canvas :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}

.showcase-copy {
  position: relative;
  z-index: 1;
  width: min(560px, 100%);
  padding: 48px 0 0 48px;
  pointer-events: none;
}

.showcase-copy p,
.showcase-copy h1 {
  margin: 0;
}

.showcase-copy p {
  color: #fecaca;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.showcase-copy h1 {
  margin-top: 8px;
  font-size: 58px;
  font-weight: 800;
  line-height: 1;
}

.showcase-copy dl {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin: 24px 0 0;
}

.showcase-copy div {
  min-width: 86px;
}

.showcase-copy dt {
  color: #94a3b8;
  font-size: 12px;
}

.showcase-copy dd {
  margin: 6px 0 0;
  font-size: 20px;
  font-weight: 700;
}

.model-note {
  display: inline-block;
  margin-top: 18px;
  color: #fca5a5;
  font-size: 13px;
  line-height: 1.6;
}

.paint-panel {
  position: absolute;
  right: 40px;
  bottom: 34px;
  z-index: 2;
  display: flex;
  gap: 12px;
}

.paint-swatch {
  width: 34px;
  height: 34px;
  border: 2px solid rgb(255 255 255 / 56%);
  border-radius: 50%;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.paint-swatch:hover,
.paint-swatch--active {
  border-color: #fff;
  box-shadow: 0 0 0 4px rgb(255 255 255 / 16%);
  transform: translateY(-2px);
}

.paint-swatch:focus-visible {
  outline: 2px solid #fecaca;
  outline-offset: 3px;
}

@media (max-width: 720px) {
  .showcase-copy {
    width: 100%;
    padding: 28px 16px 0;
  }

  .showcase-copy h1 {
    font-size: 40px;
  }

  .showcase-copy dl {
    gap: 14px;
    margin-top: 18px;
  }

  .showcase-copy dd {
    font-size: 17px;
  }

  .paint-panel {
    right: 50%;
    bottom: 22px;
    transform: translateX(50%);
  }
}
</style>

<route lang="json">
{
  "meta": {
    "title": "3D 汽车展示基础版",
    "category": "动画动效",
    "tag": "Three.js",
    "difficulty": 4
  }
}
</route>
