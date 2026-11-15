<template>
  <figure class="compare">
    <div class="compare-grid">
      <section class="compare-side">
        <header>
          <h3>单 video：直接换 src</h3>
          <span class="is-bad">画面会中断</span>
        </header>
        <SingleVideo />
      </section>

      <section class="compare-side">
        <header>
          <h3>双 video：双缓冲</h3>
          <span class="is-good">画面不中断</span>
        </header>
        <DoubleBuffer />
      </section>
    </div>
  </figure>
</template>

<script setup lang="ts">
import SingleVideo from './single-video.vue'
import DoubleBuffer from './index.vue'
</script>

<style scoped>
.compare {
  margin: 0;
  padding: 16px;
  color: #64748b;
  font-size: 13px;
}

.compare-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.compare-side {
  min-width: 0;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  padding: 12px;
}

.compare-side header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px 12px;
  margin-bottom: 10px;
}

.compare-side h3 {
  margin: 0;
  color: #172033;
  font-size: 14px;
}

.compare-side :deep(.demo) {
  border: 0;
}

.is-bad {
  color: #b91c1c;
  font-weight: 600;
}

.is-good {
  color: #047857;
  font-weight: 600;
}
</style>
