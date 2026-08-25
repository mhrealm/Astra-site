<template>
  <main class="load-refresh-showcase">
    <section class="showcase-shell">
      <header class="showcase-header">
        <div>
          <p>Interaction Demo</p>
          <h1>上拉加载下拉刷新</h1>
        </div>
        <div class="version-switch" aria-label="选择演示版本">
          <button
            v-for="item in versions"
            :key="item.key"
            type="button"
            :class="{ active: activeVersion === item.key }"
            @click="activeVersion = item.key"
          >
            {{ item.label }}
          </button>
        </div>
      </header>

      <div class="phone-frame">
        <component :is="activeComponent" />
      </div>
    </section>
  </main>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import VersionOne from './version-1.vue'
import VersionTwo from './version-2.vue'

const versions = [
  { key: 'version-1', label: '刷新 + 加载', component: VersionOne },
  { key: 'version-2', label: '上拉加载', component: VersionTwo },
] as const

const activeVersion = ref<(typeof versions)[number]['key']>('version-1')
const activeComponent = computed(
  () => versions.find((item) => item.key === activeVersion.value)?.component ?? VersionOne,
)
</script>

<style scoped>
.load-refresh-showcase {
  min-height: 100%;
  padding: 28px 20px 44px;
  background: #f2f3f5;
  color: #252933;
}

.showcase-shell {
  display: grid;
  gap: 22px;
  justify-items: center;
  margin: 0 auto;
  max-width: 1040px;
}

.showcase-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
}

.showcase-header p,
.showcase-header h1 {
  margin: 0;
}

.showcase-header p {
  color: #1e80ff;
  font-size: 13px;
  font-weight: 800;
}

.showcase-header h1 {
  margin-top: 6px;
  font-size: 28px;
  line-height: 1.25;
}

.version-switch {
  display: inline-flex;
  gap: 6px;
  border: 1px solid #e4e6eb;
  border-radius: 6px;
  background: #fff;
  padding: 4px;
}

.version-switch button {
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: #515767;
  cursor: pointer;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  padding: 8px 12px;
}

.version-switch button.active,
.version-switch button:hover {
  background: rgba(30, 128, 255, 0.1);
  color: #1e80ff;
}

.phone-frame {
  width: min(420px, 100%);
  height: min(720px, calc(100vh - 220px));
  min-height: 520px;
  overflow: hidden;
  border: 1px solid #e4e6eb;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 12px 32px rgba(29, 33, 41, 0.08);
}

.phone-frame :deep(.version) {
  height: 100%;
}

@media (max-width: 720px) {
  .showcase-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .phone-frame {
    height: 640px;
  }
}
</style>
