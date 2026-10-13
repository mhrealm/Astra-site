---
title: '使用 Canvas 压缩图片'
description: '在上传前用 Canvas 缩放并重新编码图片，减少传输体积，并处理透明背景、格式回退和内存释放等工程问题。'
pubDate: '2026-10-13'
category: '性能优化'
categorySlug: 'performance'
tags: ['Canvas', 'Image Compress']
difficulty: 3
demoTitle: 'Canvas 图片压缩演示'
demoDescription: '上传本地图片，调整输出格式、最长边和质量，对比压缩前后的体积与画面。'
---

## 为什么要在前端压缩图片

手机拍出的照片动辄 4032 × 3024、体积 3MB 到 10MB。如果用户上传头像、商品图或者反馈截图时直接传原图，会出现几个问题：

- 弱网下上传很慢，失败重试的成本也高。
- 服务端带宽和存储被大量用不到的像素占用。
- 展示时还得再压一遍，否则列表页会加载远超显示尺寸的大图。

前端压缩的思路很直接：先把图片画到一个尺寸更合适的 Canvas 上，再按指定格式和质量重新编码成新文件，最后上传这份更小的文件。

要说明的是，前端压缩是“上传前减负”，不能替代服务端的图片处理。服务端仍然要校验文件类型和尺寸，并且最好通过 CDN 图片服务按场景输出不同规格。

## 整体流程

```text
File → 解码成位图 → 计算目标尺寸 → drawImage 绘制到 Canvas → toBlob 重新编码 → 新的 File 上传
```

整个过程只用到浏览器原生 API，不依赖第三方库。下面按步骤拆开说明，代码与本文的演示组件保持一致。

## 第一步：把文件解码成可绘制的图片

```ts
const bitmap = await createImageBitmap(file)
```

`createImageBitmap` 直接接收 `File` / `Blob`，返回一个已经解码完成的 `ImageBitmap`，可以直接交给 `drawImage`。它比传统写法更简洁，在 Worker 里也能使用。

需要兼容更老的浏览器时，可以退回到 `Image` 加对象 URL 的方式：

```ts
const loadImage = async (file: File) => {
  const url = URL.createObjectURL(file)
  const image = new Image()
  image.src = url

  try {
    await image.decode()
    return image
  } finally {
    URL.revokeObjectURL(url)
  }
}
```

很多老教程会用 `FileReader.readAsDataURL` 读取图片。它可以工作，但 base64 字符串比原始二进制大约多出三分之一，大图会额外占用不少内存，所以优先使用 `createImageBitmap` 或 `URL.createObjectURL`。

照片方向也值得注意。手机照片常常通过 EXIF 记录旋转信息，早期 iOS Safari 绘制到 Canvas 时会忽略这个信息，导致照片“躺倒”。现代浏览器默认会按 EXIF 方向解码，但如果你的用户群里还有大量老设备，需要实测确认。

## 第二步：计算目标尺寸

```ts
const getTargetSize = (width: number, height: number, maxEdge: number) => {
  const longEdge = Math.max(width, height)

  if (!maxEdge || longEdge <= maxEdge) {
    return { width, height }
  }

  const scale = maxEdge / longEdge

  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  }
}
```

缩小尺寸是压缩效果最明显的手段。像素数量和边长是平方关系：把 4032 × 3024 缩到 1920 × 1440，边长约为原来的 48%，像素数量只剩约 23%。

这里按“最长边”限制，横图竖图都能等比缩放；原图本来就比限制更小时直接保持原尺寸，不做放大，放大只会让文件变大、画面变糊。

最长边取多少要看业务场景：头像 400px 左右就够，商品详情图 1280 到 1920px，需要放大查看细节的图片可以放宽到 2560px。

## 第三步：绘制到 Canvas

```ts
const canvas = document.createElement('canvas')
canvas.width = width
canvas.height = height

const context = canvas.getContext('2d')

// JPEG 没有透明通道，透明区域默认会变成黑色，先铺一层白底
if (options.type === 'image/jpeg') {
  context.fillStyle = '#fff'
  context.fillRect(0, 0, width, height)
}

context.imageSmoothingQuality = 'high'
context.drawImage(bitmap, 0, 0, width, height)
```

两个细节：

- **透明背景**：Canvas 默认是透明的。把带透明区域的 PNG 导出成 JPEG 时，透明像素会变成黑色，所以导出 JPEG 前要先填充背景色。
- **缩放质量**：`imageSmoothingQuality = 'high'` 让浏览器使用更好的插值算法。缩放倍数特别大（比如 8000px 缩到 400px）时，一次缩放可能出现锯齿，可以每次缩小一半、分几步绘制，换取更平滑的结果。

## 第四步：重新编码导出

```ts
const canvasToBlob = (canvas: HTMLCanvasElement, type: OutputType, quality: number) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('图片导出失败'))),
      type,
      quality,
    )
  })
```

`toBlob(callback, type, quality)` 是真正“压缩”的地方：

- `type` 决定输出格式，常用 `image/jpeg` 和 `image/webp`。
- `quality` 取值 0 到 1，**只对 JPEG 和 WebP 这类有损格式生效**。PNG 是无损格式，会忽略这个参数。

优先用 `toBlob` 而不是 `toDataURL`。`toDataURL` 同步返回 base64 字符串，体积更大，编码过程还会阻塞主线程；`toBlob` 是异步的，拿到的 Blob 可以直接上传。

### 格式不支持时会悄悄回退

浏览器不支持你指定的 `type` 时不会报错，而是直接导出 PNG。比如部分旧版 Safari 不支持导出 WebP，你以为拿到了 WebP，实际是一张更大的 PNG。所以导出后要检查：

```ts
if (blob.type !== options.type) {
  // 目标格式不受支持，改用 JPEG 或直接使用原图
}
```

### 用 Canvas “压缩” PNG 往往适得其反

Canvas 导出 PNG 时只是无损重新编码，压缩率通常不如专业工具。如果不缩小尺寸，结果经常比原图还大。想减小 PNG 体积，要么缩小尺寸，要么在可以接受的前提下转成 JPEG / WebP。

## 结果比原图大时用原图

压缩不一定总能变小。原图本身已经被压得很狠、尺寸又没有缩小时，重新编码的结果可能更大。上传前加一个判断：

```ts
const uploadFile = result.blob.size < file.size ? toFile(result.blob, file.name) : file
```

把 Blob 包装成 `File`，再放进 `FormData` 上传。注意扩展名要和实际格式一致：

```ts
const toFile = (blob: Blob, originalName: string) => {
  const extension = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/png' ? 'png' : 'jpg'
  const baseName = originalName.replace(/\.[^.]+$/, '')

  return new File([blob], `${baseName}.${extension}`, { type: blob.type })
}

const formData = new FormData()
formData.append('file', uploadFile)
```

## 重新编码会丢掉什么

Canvas 只保留像素，重新编码后原图里的附加信息都会丢失：

- **EXIF 元数据**：拍摄时间、设备型号、GPS 位置等都会消失。对隐私来说这是好事，但如果业务需要拍摄时间，要在压缩前先读出来。
- **色彩空间**：Canvas 通常输出 sRGB。P3 广色域照片转换后，颜色可能会显得稍微淡一点。
- **动图**：GIF 或动态 WebP 绘制到 Canvas 后只剩一帧。

## 性能和内存

Canvas 的内存占用按像素计算，每个像素 4 字节。一张 4032 × 3024 的照片解码后约占 46MB，同时处理多张时很容易让移动端页面崩溃。

- **及时释放**：`ImageBitmap` 用完调用 `bitmap.close()`；Canvas 用完把宽高设为 0；对象 URL 不再使用时调用 `URL.revokeObjectURL`。
- **串行处理**：批量上传时一张一张压缩，或限制并发数，不要用 `Promise.all` 一次性处理几十张。
- **注意尺寸上限**：浏览器对单个 Canvas 的最大面积有限制，iOS Safari 尤其严格。超大图片应先缩小再绘制，而不是按原尺寸创建 Canvas。
- **移到 Worker**：解码和编码大图可能阻塞主线程几百毫秒。支持的环境里，可以在 Web Worker 中使用 `createImageBitmap` 和 `OffscreenCanvas` 完成整个流程：

```ts
// worker.ts，getTargetSize 复用前文的实现
self.onmessage = async (event: MessageEvent<{ file: File; maxEdge: number; quality: number }>) => {
  const { file, maxEdge, quality } = event.data
  const bitmap = await createImageBitmap(file)
  const { width, height } = getTargetSize(bitmap.width, bitmap.height, maxEdge)

  const canvas = new OffscreenCanvas(width, height)
  const context = canvas.getContext('2d')!
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality })
  self.postMessage(blob)
}
```

## 质量参数怎么选

`quality` 与文件体积不是线性关系。照片类图片在 0.75 到 0.85 之间，肉眼通常很难看出与原图的差别，体积却能明显下降；低于 0.6 后，色块和边缘噪点会越来越明显。

截图、文字、线条图这类内容对 JPEG 压缩痕迹非常敏感，文字边缘容易发虚，更适合保持 PNG 或使用较高的 WebP 质量。

经验值只是起点。可以在本文的演示页上传几张真实业务图片，对比不同格式、尺寸和质量下的体积与画面，再确定默认参数。

## 什么时候不该在前端压缩

- 用户上传的就是需要原图的内容，比如打印素材、设计稿、证件照。
- 图片本身已经很小，压缩收益可以忽略。
- 动图、SVG 等格式，绘制到 Canvas 会丢失动画或矢量特性。
- 低端设备上一次处理大量图片，压缩耗时可能超过节省的上传时间。

## 小结

Canvas 压缩图片的核心只有两步：用 `drawImage` 缩小尺寸，用 `toBlob` 以有损格式重新编码。真正决定方案是否可靠的，是这些工程细节：JPEG 透明背景要铺底色，导出格式要校验是否回退，结果更大时用原图，用完及时释放内存，大图交给 Worker 处理。把这些处理好，前端压缩就能在不影响观感的前提下，明显降低上传耗时和带宽成本。
