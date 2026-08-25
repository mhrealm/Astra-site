<template>
  <main class="interactive-car-page">
    <!-- 交互版的 3D 场景仍然只挂载 canvas，控制面板继续使用普通 DOM。 -->
    <div
      ref="sceneHostRef"
      class="interactive-canvas"
    ></div>

    <section
      class="hero-copy"
      aria-label="车型信息"
    >
      <p>{{ modelKicker }}</p>
      <h1>Chevrolet Corvette C8</h1>
      <dl>
        <div>
          <dt>Model</dt>
          <dd>Stingray</dd>
        </div>
        <div>
          <dt>Scene</dt>
          <dd>Interactive</dd>
        </div>
        <div>
          <dt>Engine</dt>
          <dd>Three.js</dd>
        </div>
      </dl>
      <span
        v-if="modelNote"
        class="model-note"
      >
        {{ modelNote }}
      </span>
    </section>

    <aside
      class="control-panel"
      aria-label="车辆交互控制"
    >
      <div class="control-group">
        <h2>Parts</h2>
        <div class="control-grid">
          <button
            type="button"
            class="control-button"
            :class="{ 'control-button--active': featureState.doors }"
            :disabled="!partSummary.doors"
            @click="toggleDoors"
          >
            车门
            <span>{{ partSummary.doors }}</span>
          </button>
          <button
            type="button"
            class="control-button"
            :class="{ 'control-button--active': featureState.hood }"
            :disabled="!partSummary.hood"
            @click="toggleHood"
          >
            前备箱
            <span>{{ partSummary.hood }}</span>
          </button>
          <button
            type="button"
            class="control-button"
            :class="{ 'control-button--active': featureState.trunk }"
            :disabled="!partSummary.trunk"
            @click="toggleTrunk"
          >
            后备箱
            <span>{{ partSummary.trunk }}</span>
          </button>
          <button
            type="button"
            class="control-button"
            :class="{ 'control-button--active': featureState.wheels }"
            :disabled="!partSummary.wheels"
            @click="toggleWheels"
          >
            车轮
            <span>{{ partSummary.wheels }}</span>
          </button>
          <button
            type="button"
            class="control-button"
            :class="{ 'control-button--active': featureState.lights }"
            :disabled="!partSummary.lights"
            @click="toggleLights"
          >
            灯光
            <span>{{ partSummary.lights }}</span>
          </button>
        </div>
      </div>

      <div class="control-group">
        <h2>Paint</h2>
        <div class="swatch-row">
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
        </div>
      </div>
    </aside>
  </main>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import gsap from 'gsap'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'

interface PaintOption {
  name: string
  label: string
  color: string
}

interface CarPaintOption extends PaintOption {
  metalness: number
  roughness: number
  clearcoatRoughness: number
  reflectivity: number
  envMapIntensity: number
  pearl: number
}

interface PartSummary {
  doors: number
  hood: number
  trunk: number
  wheels: number
  lights: number
}

interface InteractiveParts {
  doors: THREE.Object3D[]
  hood: THREE.Object3D[]
  trunk: THREE.Object3D[]
  wheels: THREE.Object3D[]
  lightMeshes: THREE.Mesh[]
}

interface TransformSnapshot {
  position: THREE.Vector3
  rotation: THREE.Euler
}

type AnimatedPartKey = 'doors' | 'hood' | 'trunk'

const corvetteModelUrl = new URL('./models/chevrolet-corvette-c8.glb', import.meta.url).href

const sceneHostRef = ref<HTMLDivElement | null>(null)
const activePaint = ref('corvette-red')
const modelNote = ref('')
const modelKicker = 'Animated Sports Car Configurator'

const initialCameraPosition = new THREE.Vector3(2.15, 0.55, 4.85)
const cockpitTargetPosition = new THREE.Vector3(-0.08, 0.76, 0.22)

const paintOptions: CarPaintOption[] = [
  { name: 'corvette-red', label: 'Corvette Red', color: '#8f1418', metalness: 0.16, roughness: 0.22, clearcoatRoughness: 0.03, reflectivity: 0.68, envMapIntensity: 1.36, pearl: 0.04 },
  { name: 'ceramic-white', label: 'Ceramic White', color: '#98a3ad', metalness: 0.05, roughness: 0.43, clearcoatRoughness: 0.09, reflectivity: 0.28, envMapIntensity: 0.58, pearl: 0.02 },
  { name: 'blade-silver', label: 'Blade Silver', color: '#b5bec7', metalness: 0.28, roughness: 0.2, clearcoatRoughness: 0.028, reflectivity: 0.7, envMapIntensity: 1.42, pearl: 0.1 },
  { name: 'night-black', label: 'Night Black', color: '#05070a', metalness: 0.14, roughness: 0.18, clearcoatRoughness: 0.026, reflectivity: 0.74, envMapIntensity: 1.58, pearl: 0.02 },
]

const featureState = reactive({
  doors: false,
  hood: false,
  trunk: false,
  wheels: false,
  lights: false,
})

const partSummary = reactive<PartSummary>({
  doors: 0,
  hood: 0,
  trunk: 0,
  wheels: 0,
  lights: 0,
})

const parts: InteractiveParts = {
  doors: [],
  hood: [],
  trunk: [],
  wheels: [],
  lightMeshes: [],
}

let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
let controls: OrbitControls | null = null
let carGroup: THREE.Group | null = null
let bodyMaterial: THREE.MeshPhysicalMaterial | null = null
let environmentMap: THREE.WebGLRenderTarget | null = null
let animationMixer: THREE.AnimationMixer | null = null
let animationFrameId = 0

const transformSnapshots = new Map<THREE.Object3D, TransformSnapshot>()
const customMaterials = new Set<THREE.Material>()
const lightMaterials = new Set<THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial>()
const animationClock = new THREE.Clock()
const animatedActions: Record<AnimatedPartKey, THREE.AnimationAction[]> = {
  doors: [],
  hood: [],
  trunk: [],
}

const getHostSize = () => {
  const host = sceneHostRef.value

  return {
    width: host?.clientWidth || window.innerWidth,
    height: host?.clientHeight || window.innerHeight,
  }
}

const includesAny = (value: string, keywords: string[]) => keywords.some(keyword => value.includes(keyword))

const normalizeText = (...values: Array<string | undefined>) => {
  return values.filter(Boolean).join(' ').toLowerCase().replace(/[_-]+/g, ' ')
}

const getFirstMaterial = (material: THREE.Material | THREE.Material[]) => {
  return Array.isArray(material) ? material[0] : material
}

const getObjectText = (object: THREE.Object3D) => {
  if (object instanceof THREE.Mesh) {
    const material = getFirstMaterial(object.material)
    return normalizeText(object.name, material?.name)
  }

  return normalizeText(object.name)
}

const clonePhysicalMaterial = (
  sourceMaterial: THREE.Material,
  option: PaintOption,
  overrides: Partial<THREE.MeshPhysicalMaterialParameters> = {},
) => {
  const source = sourceMaterial instanceof THREE.MeshStandardMaterial ? sourceMaterial : null
  const material = new THREE.MeshPhysicalMaterial({
    color: option.color,
    map: source?.map || null,
    metalnessMap: source?.metalnessMap || null,
    roughnessMap: source?.roughnessMap || null,
    normalMap: source?.normalMap || null,
    aoMap: source?.aoMap || null,
    metalness: 0.16,
    roughness: 0.24,
    clearcoat: 1,
    clearcoatRoughness: 0.035,
    reflectivity: 0.66,
    ior: 1.55,
    specularIntensity: 1,
    specularColor: '#ffffff',
    envMapIntensity: 1.36,
    transparent: false,
    opacity: 1,
    ...overrides,
  })

  customMaterials.add(material)
  return material
}

const getActivePaint = () => paintOptions.find(paint => paint.name === activePaint.value) || paintOptions[0]!

const applyCarPaintToMaterial = (material: THREE.MeshPhysicalMaterial, paint: CarPaintOption) => {
  // 真实车漆不是一整块金属，而是底色 + 透明清漆层。
  // metalness 保持偏低，主要靠 clearcoat、reflectivity 和环境反射做出漆面高光。
  material.color.set(paint.color)
  material.metalness = paint.metalness
  material.roughness = paint.roughness
  material.clearcoat = 1
  material.clearcoatRoughness = paint.clearcoatRoughness
  material.reflectivity = paint.reflectivity
  material.ior = 1.55
  material.specularIntensity = 1
  material.specularColor.set('#ffffff')
  material.envMapIntensity = paint.envMapIntensity
  material.iridescence = paint.pearl
  material.iridescenceIOR = 1.32
  material.iridescenceThicknessRange = [120, 360]
  material.needsUpdate = true
}

const createBodyMaterial = (sourceMaterial: THREE.Material) => {
  const currentPaint = getActivePaint()
  const material = clonePhysicalMaterial(sourceMaterial, currentPaint)
  material.name = 'c8-interactive-paint'
  applyCarPaintToMaterial(material, currentPaint)
  return material
}

const createLightMaterial = (sourceMaterial: THREE.Material, text: string) => {
  const material =
    sourceMaterial instanceof THREE.MeshStandardMaterial
      ? sourceMaterial.clone()
      : new THREE.MeshStandardMaterial({ color: '#e5e7eb', roughness: 0.2, metalness: 0 })
  const isRearLight = includesAny(text, ['tail', 'brake'])

  material.color.set(isRearLight ? '#3f080e' : '#eef6ff')
  material.emissive.set(isRearLight ? '#ff2638' : '#fff4d6')
  material.emissiveIntensity = 0.08
  material.toneMapped = false
  material.userData.lightOnIntensity = isRearLight ? 1.05 : 2.15
  material.userData.lightOffIntensity = 0.08

  customMaterials.add(material)
  lightMaterials.add(material)

  return material
}

const isBodyMesh = (text: string) => {
  const keywords = ['paint', 'body', 'carpaint', 'car paint', 'exterior', 'corvette', 'c8']
  const ignored = ['glass', 'window', 'tire', 'tyre', 'rubber', 'rim', 'wheel', 'light', 'lamp']

  return includesAny(text, keywords) && !includesAny(text, ignored)
}

const isMainLightMesh = (text: string) => {
  const ignored = ['day light', 'indicator', 'reverse', 'license', 'brake disc']

  return includesAny(text, ['light', 'headlight', 'taillight', 'brake']) && !includesAny(text, ignored)
}

const isModelBaseMesh = (mesh: THREE.Mesh) => {
  const material = getFirstMaterial(mesh.material)
  const text = normalizeText(mesh.name, material?.name)

  return includesAny(text, ['plane', 'material.052'])
}

const clearPartCollections = () => {
  parts.doors.length = 0
  parts.hood.length = 0
  parts.trunk.length = 0
  parts.wheels.length = 0
}

const clearAllPartCollections = () => {
  Object.values(parts).forEach(collection => {
    collection.length = 0
  })
}

const clearAnimationActions = () => {
  animationMixer?.stopAllAction()

  Object.values(animatedActions).forEach(collection => {
    collection.length = 0
  })

  animationMixer = null
}

const hasMatchedAncestor = (object: THREE.Object3D, root: THREE.Object3D, keywords: string[]) => {
  let parent = object.parent

  while (parent && parent !== root) {
    if (includesAny(getObjectText(parent), keywords)) {
      return true
    }

    parent = parent.parent
  }

  return false
}

const collectTopLevelObjects = (root: THREE.Object3D, keywords: string[], ignored: string[] = []) => {
  const result: THREE.Object3D[] = []

  root.traverse(object => {
    if (object === root) {
      return
    }

    const text = getObjectText(object)

    if (!includesAny(text, keywords) || includesAny(text, ignored)) {
      return
    }

    // 如果父级已经是 door/hood 这类部件，就收父级，不再把内部每个 mesh 都收进来。
    // 这样旋转时只动一次，避免父子节点重复叠加旋转。
    if (hasMatchedAncestor(object, root, keywords)) {
      return
    }

    result.push(object)
  })

  return Array.from(new Set(result))
}

const collectInteractiveParts = (model: THREE.Object3D) => {
  clearPartCollections()

  parts.doors.push(...collectTopLevelObjects(model, ['door'], ['sill']))
  parts.hood.push(...collectTopLevelObjects(model, ['frunk'], ['badge', 'logo']))

  if (!parts.hood.length) {
    parts.hood.push(...collectTopLevelObjects(model, ['hood', 'bonnet'], ['badge', 'logo', 'trunk', 'boot']))
  }

  parts.trunk.push(...collectTopLevelObjects(model, ['trunk', 'boot'], ['badge', 'logo']))
  parts.wheels.push(...collectTopLevelObjects(model, ['wheel', 'tire', 'tyre'], ['steering']))
}

const syncPartSummary = () => {
  partSummary.doors = animatedActions.doors.length || parts.doors.length
  partSummary.hood = animatedActions.hood.length || parts.hood.length
  partSummary.trunk = animatedActions.trunk.length || parts.trunk.length
  partSummary.wheels = parts.wheels.length
  partSummary.lights = parts.lightMeshes.length
}

const getTrackTargetName = (trackName: string) => {
  return trackName.split('.')[0]?.replace(/^\//, '') || ''
}

const getAnimationTargetText = (clip: THREE.AnimationClip, root: THREE.Object3D) => {
  const texts = new Set<string>()

  clip.tracks.forEach(track => {
    const targetName = getTrackTargetName(track.name)
    let current = targetName ? root.getObjectByName(targetName) : null

    // C8 的动画目标名比较泛，比如 Object_239。
    // 往父级找一圈，才能知道它实际挂在 Left Door / Frunk / Trunk 下面。
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

const resetAnimatedActionsToStart = () => {
  const actions = Object.values(animatedActions).flat()

  actions.forEach(action => {
    const duration = action.getClip().duration

    action.reset()
    action.setLoop(THREE.LoopOnce, 1)
    action.clampWhenFinished = true
    action.enabled = true
    action.paused = true
    action.time = duration
    action.play()
  })

  // C8 的动画第 0 帧是打开态，末帧才是闭合态。
  // 应用末帧后，按钮初始状态和模型闭合状态才能一致。
  animationMixer?.update(0)
}

const collectAnimatedActions = (model: THREE.Object3D, animations: THREE.AnimationClip[]) => {
  clearAnimationActions()

  if (!animations.length) {
    syncPartSummary()
    return
  }

  animationMixer = new THREE.AnimationMixer(model)

  animations.forEach(clip => {
    const text = getAnimationTargetText(clip, model)
    let key: AnimatedPartKey | null = null

    if (includesAny(text, ['door'])) {
      key = 'doors'
    } else if (includesAny(text, ['frunk', 'bonnet']) || (includesAny(text, ['hood']) && !includesAny(text, ['trunk', 'boot']))) {
      key = 'hood'
    } else if (includesAny(text, ['trunk', 'boot'])) {
      key = 'trunk'
    }

    if (!key) {
      return
    }

    const action = animationMixer!.clipAction(clip)
    action.setLoop(THREE.LoopOnce, 1)
    action.clampWhenFinished = true
    action.enabled = true
    animatedActions[key].push(action)
  })

  resetAnimatedActionsToStart()
  syncPartSummary()
}

const prepareCarModel = (model: THREE.Object3D) => {
  clearAllPartCollections()

  model.traverse(object => {
    if (!(object instanceof THREE.Mesh)) {
      return
    }

    object.castShadow = true
    object.receiveShadow = true

    if (isModelBaseMesh(object)) {
      object.visible = false
      return
    }

    const text = getObjectText(object)
    const sourceMaterial = getFirstMaterial(object.material)

    if (!sourceMaterial) {
      return
    }

    // 这里只保留肉眼最明显的前灯和尾灯，其他不明显的灯位不再增加判断分支。
    if (isMainLightMesh(text)) {
      object.material = createLightMaterial(sourceMaterial, text)
      parts.lightMeshes.push(object)
      return
    }

    if (isBodyMesh(text)) {
      bodyMaterial = bodyMaterial || createBodyMaterial(sourceMaterial)
      object.material = bodyMaterial
    }
  })

  collectInteractiveParts(model)
  syncPartSummary()
}

const fitModelToStage = (model: THREE.Object3D) => {
  const box = new THREE.Box3().setFromObject(model)
  const size = box.getSize(new THREE.Vector3())
  const maxSize = Math.max(size.x, size.y, size.z)

  model.scale.setScalar(5.5 / maxSize)

  const centeredBox = new THREE.Box3().setFromObject(model)
  const center = centeredBox.getCenter(new THREE.Vector3())
  model.position.sub(center)

  const finalBox = new THREE.Box3().setFromObject(model)
  model.position.y -= finalBox.min.y
}

const loadCarModel = async () => {
  try {
    const loader = new GLTFLoader()
    const gltf = await loader.loadAsync(corvetteModelUrl)
    const model = gltf.scene

    if (!scene) {
      disposeObject(model)
      return
    }

    prepareCarModel(model)
    collectAnimatedActions(model, gltf.animations)
    fitModelToStage(model)

    carGroup = new THREE.Group()
    carGroup.add(model)
    carGroup.rotation.y = -0.48
    scene.add(carGroup)

    updateLights()
  } catch (error) {
    modelNote.value = '模型加载失败，请检查模型文件路径。'
    console.error('Failed to load car model:', error)
  }
}

const createStage = () => {
  // GridHelper 只是一组线条，不是实心地板。
  // 保留它可以让用户感知空间方向，同时不会像地板一样盖住或压暗车底。
  const grid = new THREE.GridHelper(18, 36, '#64748b', '#334155')

  // 稍微抬高一点，避免和模型底部同在 y=0 时出现闪烁。
  // 这里不再创建白色外圈光环，让进阶版网格和基础版保持一致。
  grid.position.y = 0.018

  scene?.add(grid)
}

const createStudioLights = () => {
  const frontSoftbox = new THREE.RectAreaLight('#ffffff', 0.95, 4.8, 1.5)
  const sideSoftbox = new THREE.RectAreaLight('#dbeafe', 0.45, 3.9, 1.4)

  // 两盏摄影棚柔光不会显示成物体，只负责给清漆层更自然的长条高光。
  frontSoftbox.position.set(-2.5, 3.3, 4.5)
  sideSoftbox.position.set(4.4, 2.5, -2.7)
  frontSoftbox.lookAt(0, 0.86, 0)
  sideSoftbox.lookAt(0, 0.86, 0)

  scene?.add(frontSoftbox, sideSoftbox)
}

const initScene = () => {
  const host = sceneHostRef.value

  if (!host) {
    return
  }

  const { width, height } = getHostSize()

  scene = new THREE.Scene()
  scene.background = new THREE.Color('#090d12')
  scene.fog = new THREE.Fog('#090d12', 10, 24)

  // near 调小后，镜头贴近车窗或进入车内时，内饰不容易被相机近裁剪面切掉。
  camera = new THREE.PerspectiveCamera(42, width / height, 0.03, 100)
  camera.position.copy(initialCameraPosition)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.7
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  host.appendChild(renderer.domElement)
  RectAreaLightUniformsLib.init()

  const pmremGenerator = new THREE.PMREMGenerator(renderer)
  environmentMap = pmremGenerator.fromScene(new RoomEnvironment(), 0.04)
  scene.environment = environmentMap.texture
  pmremGenerator.dispose()

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  // 允许平移和更近的缩放距离，鼠标滚轮可以直接推进到座舱内。
  controls.enablePan = true
  controls.screenSpacePanning = true
  controls.panSpeed = 0.42
  controls.zoomSpeed = 0.82
  controls.minDistance = 0.18
  controls.maxDistance = 9
  controls.minPolarAngle = 0.05
  controls.maxPolarAngle = Math.PI - 0.05
  controls.target.copy(cockpitTargetPosition)

  const keyLight = new THREE.DirectionalLight('#ffffff', 1.45)
  const fillLight = new THREE.DirectionalLight('#f8fafc', 0.28)
  const edgeLight = new THREE.PointLight('#ffffff', 14, 12)
  const ambientLight = new THREE.HemisphereLight('#f8fafc', '#020617', 0.5)

  keyLight.position.set(4.4, 7.2, 5.2)
  keyLight.castShadow = true
  keyLight.shadow.mapSize.set(2048, 2048)
  fillLight.position.set(-5, 4.2, -5.2)
  edgeLight.position.set(-3.7, 1.8, -3)

  scene.add(keyLight, fillLight, edgeLight, ambientLight)

  createStudioLights()
  createStage()
  void loadCarModel()
}

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

const getObjectSide = (object: THREE.Object3D) => {
  const text = getObjectText(object)

  if (includesAny(text, ['left', ' lhs', '_l', '.l', ' l '])) {
    return 'left'
  }

  if (includesAny(text, ['right', ' rhs', '_r', '.r', ' r '])) {
    return 'right'
  }

  const center = new THREE.Box3().setFromObject(object).getCenter(new THREE.Vector3())
  return center.x < 0 ? 'left' : 'right'
}

const animatePart = (
  object: THREE.Object3D,
  open: boolean,
  rotationOffset: Partial<Record<'x' | 'y' | 'z', number>>,
  positionOffset: Partial<Record<'x' | 'y' | 'z', number>> = {},
) => {
  const snapshot = getSnapshot(object)
  const targetRotation = {
    x: snapshot.rotation.x + (open ? rotationOffset.x || 0 : 0),
    y: snapshot.rotation.y + (open ? rotationOffset.y || 0 : 0),
    z: snapshot.rotation.z + (open ? rotationOffset.z || 0 : 0),
  }
  const targetPosition = {
    x: snapshot.position.x + (open ? positionOffset.x || 0 : 0),
    y: snapshot.position.y + (open ? positionOffset.y || 0 : 0),
    z: snapshot.position.z + (open ? positionOffset.z || 0 : 0),
  }

  gsap.killTweensOf(object.rotation)
  gsap.killTweensOf(object.position)

  // GSAP 可以直接补间 Object3D 的 rotation/position。
  // 只要模型的 pivot 在正确铰链位置，旋转就会像真实开合。
  gsap.to(object.rotation, {
    ...targetRotation,
    duration: 0.7,
    ease: 'power2.out',
  })
  gsap.to(object.position, {
    ...targetPosition,
    duration: 0.7,
    ease: 'power2.out',
  })
}

const playAnimatedActions = (key: AnimatedPartKey, open: boolean) => {
  const actions = animatedActions[key]

  if (!actions.length) {
    return false
  }

  actions.forEach(action => {
    const duration = action.getClip().duration

    action.setLoop(THREE.LoopOnce, 1)
    action.clampWhenFinished = true
    action.enabled = true
    action.paused = true
    action.play()

    gsap.killTweensOf(action)
    gsap.to(action, {
      time: open ? 0 : duration,
      duration: 0.75,
      ease: 'power2.out',
      onUpdate: () => animationMixer?.update(0),
    })
  })

  return true
}

const toggleDoors = () => {
  featureState.doors = !featureState.doors

  if (playAnimatedActions('doors', featureState.doors)) {
    return
  }

  parts.doors.forEach(part => {
    const side = getObjectSide(part)
    animatePart(part, featureState.doors, { y: side === 'left' ? -0.92 : 0.92 })
  })
}

const toggleHood = () => {
  featureState.hood = !featureState.hood

  if (playAnimatedActions('hood', featureState.hood)) {
    return
  }

  parts.hood.forEach(part => animatePart(part, featureState.hood, { x: -0.72 }))
}

const toggleTrunk = () => {
  featureState.trunk = !featureState.trunk

  if (playAnimatedActions('trunk', featureState.trunk)) {
    return
  }

  parts.trunk.forEach(part => animatePart(part, featureState.trunk, { x: 0.72 }))
}

const toggleWheels = () => {
  featureState.wheels = !featureState.wheels
}

const updateLights = () => {
  const intensityKey = featureState.lights ? 'lightOnIntensity' : 'lightOffIntensity'

  lightMaterials.forEach(material => {
    material.emissiveIntensity = Number(material.userData[intensityKey])
    material.needsUpdate = true
  })
}

const toggleLights = () => {
  featureState.lights = !featureState.lights
  updateLights()
}

const applyPaint = (paint: CarPaintOption) => {
  activePaint.value = paint.name

  if (bodyMaterial) {
    applyCarPaintToMaterial(bodyMaterial, paint)
  }
}

const spinWheels = () => {
  // 车轮旋转轴和模型制作方式有关。
  // 这里先按常见的 x 轴旋转处理，下载模型后如果方向不对，只需要改这一行。
  if (!featureState.wheels) {
    return
  }

  parts.wheels.forEach(wheel => {
    wheel.rotation.x += 0.04
  })
}

const renderScene = () => {
  if (!renderer || !scene || !camera) {
    return
  }

  animationMixer?.update(animationClock.getDelta())
  spinWheels()
  controls?.update()
  renderer.render(scene, camera)

  animationFrameId = window.requestAnimationFrame(renderScene)
}

const handleResize = () => {
  if (!camera || !renderer) {
    return
  }

  const { width, height } = getHostSize()

  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

const disposeMaterial = (material: THREE.Material | THREE.Material[], disposedMaterials: Set<THREE.Material>) => {
  const materials = Array.isArray(material) ? material : [material]

  materials.forEach(item => {
    if (disposedMaterials.has(item)) {
      return
    }

    item.dispose()
    disposedMaterials.add(item)
  })
}

const disposeObject = (object: THREE.Object3D) => {
  const disposedGeometries = new Set<THREE.BufferGeometry>()
  const disposedMaterials = new Set<THREE.Material>()

  object.traverse(child => {
    if (!(child instanceof THREE.Mesh)) {
      return
    }

    if (!disposedGeometries.has(child.geometry)) {
      child.geometry.dispose()
      disposedGeometries.add(child.geometry)
    }

    disposeMaterial(child.material, disposedMaterials)
  })
}

const disposeScene = () => {
  window.cancelAnimationFrame(animationFrameId)
  window.removeEventListener('resize', handleResize)

  transformSnapshots.forEach((_, object) => {
    gsap.killTweensOf(object.rotation)
    gsap.killTweensOf(object.position)
  })

  clearAnimationActions()
  controls?.dispose()

  if (scene) {
    disposeObject(scene)
  }

  customMaterials.forEach(material => material.dispose())
  environmentMap?.dispose()
  renderer?.dispose()
  renderer?.domElement.remove()

  scene = null
  camera = null
  renderer = null
  controls = null
  carGroup = null
  bodyMaterial = null
  environmentMap = null
  transformSnapshots.clear()
  customMaterials.clear()
  lightMaterials.clear()
  clearAllPartCollections()
}

onMounted(() => {
  initScene()
  window.addEventListener('resize', handleResize)
  renderScene()
})

onBeforeUnmount(disposeScene)
</script>

<style scoped lang="less">
.interactive-car-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: #080b10;
  color: #f8fafc;
}

.interactive-canvas {
  position: absolute;
  inset: 0;
}

.interactive-canvas :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}

.hero-copy {
  position: relative;
  z-index: 1;
  width: min(560px, calc(100vw - 40px));
  padding: 44px 0 0 44px;
  pointer-events: none;
}

.hero-copy p,
.hero-copy h1 {
  margin: 0;
}

.hero-copy p {
  color: #fecaca;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.hero-copy h1 {
  margin-top: 8px;
  font-size: 56px;
  font-weight: 800;
  line-height: 1;
}

.hero-copy dl {
  display: flex;
  flex-wrap: wrap;
  gap: 22px;
  margin: 22px 0 0;
}

.hero-copy div {
  min-width: 94px;
}

.hero-copy dt {
  color: #94a3b8;
  font-size: 12px;
}

.hero-copy dd {
  margin: 6px 0 0;
  font-size: 18px;
  font-weight: 700;
}

.model-note {
  display: inline-block;
  margin-top: 18px;
  color: #fca5a5;
  font-size: 13px;
  line-height: 1.6;
}

.control-panel {
  position: absolute;
  right: 28px;
  bottom: 28px;
  z-index: 2;
  box-sizing: border-box;
  width: min(288px, calc(100vw - 32px));
  padding: 14px;
  border: 1px solid rgb(255 255 255 / 14%);
  border-radius: 8px;
  background: rgb(8 11 16 / 78%);
  box-shadow: 0 18px 50px rgb(0 0 0 / 34%);
  backdrop-filter: blur(14px);
}

.control-group+.control-group {
  margin-top: 14px;
}

.control-group h2 {
  margin: 0 0 10px;
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.control-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.control-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 5px;
  min-height: 38px;
  padding: 0 8px;
  border: 1px solid rgb(255 255 255 / 14%);
  border-radius: 7px;
  background: rgb(255 255 255 / 7%);
  color: #e5e7eb;
  cursor: pointer;
  font-size: 13px;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.control-button span {
  color: #94a3b8;
  font-size: 12px;
}

.control-button:hover,
.control-button--active {
  border-color: rgb(248 250 252 / 58%);
  background: rgb(248 250 252 / 16%);
  color: #fff;
  transform: translateY(-1px);
}

.control-button:disabled,
.paint-swatch:disabled {
  cursor: not-allowed;
  opacity: 0.42;
  transform: none;
}

.swatch-row {
  display: flex;
  gap: 10px;
}

.paint-swatch {
  width: 30px;
  height: 30px;
  border: 2px solid rgb(255 255 255 / 48%);
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
  box-shadow: 0 0 0 4px rgb(255 255 255 / 14%);
  transform: translateY(-2px);
}

@media (max-width: 820px) {
  .hero-copy {
    width: calc(100vw - 32px);
    padding: 28px 16px 0;
  }

  .hero-copy h1 {
    font-size: 40px;
  }

  .hero-copy dl {
    gap: 14px;
    margin-top: 18px;
  }

  .control-panel {
    right: 16px;
    bottom: 16px;
    left: 16px;
    width: auto;
    padding: 14px;
  }

  .control-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>

<route lang="json">{
  "meta": {
    "title": "3D 汽车交互展示",
    "category": "动画动效",
    "tag": "Three.js",
    "difficulty": 5
  }
}</route>
