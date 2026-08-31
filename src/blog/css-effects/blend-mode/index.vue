<template>
  <main class="blend-mode-page">
    <section class="blend-shell">
      <header class="blend-header">
        <div>
          <p>CSS / Blend Mode</p>
          <h1>混合模式</h1>
        </div>
        <select v-model="activeMode" aria-label="选择混合模式">
          <option v-for="mode in modes" :key="mode" :value="mode">
            {{ mode }}
          </option>
        </select>
      </header>

      <div class="blend-stage">
        <div class="blend-preview" :style="{ '--blend-mode': activeMode }">
          <span>BLEND</span>
          <strong>{{ activeMode }}</strong>
        </div>
        <div class="mode-grid">
          <button
            v-for="mode in modes"
            :key="mode"
            type="button"
            :class="{ active: mode === activeMode }"
            @click="activeMode = mode"
          >
            {{ mode }}
          </button>
        </div>
      </div>

      <p class="blend-note">
        当前文字层使用 <code>mix-blend-mode: {{ activeMode }}</code
        >，切换不同模式可以观察文字和背景颜色如何重新混合。
      </p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const modes = ['normal', 'multiply', 'screen', 'overlay', 'difference', 'color-dodge', 'luminosity']
const activeMode = ref('difference')
</script>

<style scoped>
.blend-mode-page {
  box-sizing: border-box;
  min-height: 100%;
  padding: 28px;
  color: #1d2129;
}

.blend-shell {
  max-width: 980px;
  margin: 0 auto;
  border: 1px solid #e4e6eb;
  border-radius: 8px;
  background: #fff;
  padding: 22px;
  box-shadow: 0 1px 2px rgb(29 33 41 / 4%);
}

.blend-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.blend-header p,
.blend-header h1,
.blend-note {
  margin: 0;
}

.blend-header p {
  color: #1e80ff;
  font-size: 13px;
  font-weight: 800;
}

.blend-header h1 {
  margin-top: 6px;
  font-size: 24px;
  line-height: 1.25;
}

.blend-header select {
  min-width: 160px;
  border: 1px solid #e4e6eb;
  border-radius: 6px;
  background: #fff;
  padding: 9px 12px;
  color: #1d2129;
  font-weight: 700;
}

.blend-stage {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 18px;
}

.blend-preview {
  position: relative;
  display: grid;
  min-height: 420px;
  overflow: hidden;
  place-items: center;
  border-radius: 8px;
  background:
    radial-gradient(circle at 25% 25%, #f97316 0 18%, transparent 19%),
    radial-gradient(circle at 72% 28%, #1e80ff 0 17%, transparent 18%),
    radial-gradient(circle at 48% 78%, #22c55e 0 20%, transparent 21%),
    linear-gradient(135deg, #111827, #7c3aed 48%, #f43f5e);
}

.blend-preview::before {
  position: absolute;
  inset: 34px;
  border: 1px solid rgba(255, 255, 255, 0.26);
  border-radius: 8px;
  content: '';
}

.blend-preview span,
.blend-preview strong {
  position: relative;
  z-index: 1;
  color: #fff;
  mix-blend-mode: var(--blend-mode);
}

.blend-preview span {
  font-size: clamp(58px, 16vw, 160px);
  font-weight: 950;
  line-height: 0.9;
}

.blend-preview strong {
  position: absolute;
  right: 34px;
  bottom: 28px;
  border-radius: 6px;
  background: #fff;
  padding: 8px 12px;
  color: #111827;
  font-size: 14px;
  mix-blend-mode: normal;
}

.mode-grid {
  display: grid;
  align-content: start;
  gap: 10px;
}

.mode-grid button {
  border: 1px solid #e4e6eb;
  border-radius: 6px;
  background: #fff;
  padding: 11px 12px;
  color: #515767;
  font-weight: 800;
  text-align: left;
  cursor: pointer;
}

.mode-grid button.active,
.mode-grid button:hover {
  border-color: #1e80ff;
  color: #1e80ff;
}

.blend-note {
  margin-top: 16px;
  color: #515767;
  font-size: 14px;
  line-height: 1.8;
}

.blend-note code {
  border-radius: 4px;
  background: #f2f3f5;
  padding: 2px 6px;
  color: #1e80ff;
}

@media (max-width: 760px) {
  .blend-mode-page {
    padding: 16px;
  }

  .blend-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .blend-stage {
    grid-template-columns: 1fr;
  }

  .mode-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
}
</style>
