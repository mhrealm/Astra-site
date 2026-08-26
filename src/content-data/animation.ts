/**
 * 车漆配置列表。
 */

export interface PaintOption {
  name: string // 点击色卡时用它判断是否选中。
  label: string // 色卡的可读名称，主要给 aria-label 和读屏软件使用。
  color: string // 色卡颜色，也是车身材质的基础颜色。
  metalness: number // 金属度，数值越高越像金属。
  roughness: number // 粗糙度，数值越低高光越锐利，数值越高反射越柔。
  clearcoatRoughness: number // 清漆层粗糙度，用来控制车漆表面高光是否干净。
  reflectivity: number // 反射强度，用来控制清漆层对环境的反射程度。
  envMapIntensity: number // 环境贴图强度，直接影响车漆是否有明显摄影棚高光。
  pearl: number // 珠光/虹彩强度，用少量数值模拟车漆里的细微变色层。
}

export const paintOptions: PaintOption[] = [
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
  },
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
  },
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
  },
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
  },
]
