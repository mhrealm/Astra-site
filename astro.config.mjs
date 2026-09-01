// @ts-check

import mdx from '@astrojs/mdx'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import vue from '@astrojs/vue'
import { defineConfig, fontProviders } from 'astro/config'

// https://astro.build/config
export default defineConfig({
  site: 'https://example.com',
  devToolbar: {
    enabled: false,
  },
  integrations: [mdx(), vue(), react(), sitemap()],
  vite: {
    optimizeDeps: {
      include: [
        'gsap',
        'gsap/ScrollTrigger',
        'globe.gl',
        'jquery',
        'three',
        'three/examples/jsm/controls/OrbitControls.js',
        'three/examples/jsm/environments/RoomEnvironment.js',
        'three/examples/jsm/lights/RectAreaLightUniformsLib.js',
        'three/examples/jsm/loaders/GLTFLoader.js',
      ],
      rolldownOptions: {
        transform: {
          define: {
            'process.env.NODE_ENV': '"development"',
          },
        },
      },
    },
  },
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Atkinson',
      cssVariable: '--font-atkinson',
      fallbacks: ['sans-serif'],
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/atkinson-regular.woff'],
            weight: 400,
            style: 'normal',
            display: 'swap',
          },
          {
            src: ['./src/assets/fonts/atkinson-bold.woff'],
            weight: 700,
            style: 'normal',
            display: 'swap',
          },
        ],
      },
    },
  ],
})
