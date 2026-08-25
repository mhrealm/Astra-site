<template>
  <main class="note-page">
    <header class="hero">
      <p class="eyebrow">JavaScript Async Pattern</p>
      <h1>异步调用和延迟执行有哪些应用？</h1>
      <p class="summary">
        异步调用解决“不阻塞等待结果”，延迟执行解决“不要立刻执行”。真实业务里，它们经常一起出现。
      </p>
    </header>

    <section class="compare">
      <article>
        <h2>异步调用</h2>
        <p>网络请求、文件读取、Worker 计算、用户授权、支付提交等，都属于结果稍后返回的流程。</p>
      </article>

      <article>
        <h2>延迟执行</h2>
        <p>防抖、节流、下一帧执行、空闲执行、延迟重试、轮询间隔等，都属于控制任务执行时机。</p>
      </article>
    </section>

    <section class="scenario-list">
      <h2>常见组合场景</h2>
      <ul>
        <li>搜索联想：输入防抖后再发起异步请求。</li>
        <li>无限滚动：滚动节流后再异步加载下一页。</li>
        <li>接口容错：异步请求失败后延迟重试。</li>
        <li>动画启动：DOM 更新后等下一帧读取尺寸。</li>
        <li>大任务拆片：延迟切分任务，避免主线程长时间卡住。</li>
      </ul>
    </section>

    <section class="code-section">
      <h2>典型场景：延迟重试</h2>
      <pre><code>const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
          async function retry(task, times = 3) {
            for (let i = 0; i < times; i++) {
              try {
                return await task()
              } catch (error) {
                if (i === times - 1) throw error
                await sleep(2 ** i * 500)
              }
            }
          }

</code></pre>
    </section>
  </main>
</template>

<style lang="less" scoped>
.note-page {
  max-width: 980px;
  margin: 0 auto;
  padding: 32px 16px 56px;
  color: #1f2937;
}

.hero {
  margin-bottom: 28px;
}

.eyebrow {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 700;
  color: #b45309;
}

h1 {
  margin: 0;
  font-size: 32px;
  line-height: 1.25;
}

.summary {
  max-width: 760px;
  margin: 12px 0 0;
  color: #4b5563;
  line-height: 1.8;
}

.compare {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.compare article,
.scenario-list,
.code-section {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  padding: 20px;
}

h2 {
  margin: 0 0 12px;
  font-size: 20px;
}

p,
li {
  line-height: 1.8;
}

ul {
  margin: 0;
  padding-left: 20px;
}

.scenario-list,
.code-section {
  margin-top: 16px;
}

pre {
  margin: 0;
  padding: 16px;
  overflow-x: auto;
  border-radius: 8px;
  background: #111827;
  color: #f9fafb;
  line-height: 1.6;
}

@media (max-width: 720px) {
  .compare {
    grid-template-columns: 1fr;
  }

  h1 {
    font-size: 26px;
  }
}
</style>

<route lang="json">{
  "meta": {
    "title": "异步调用与延迟执行",
    "category": "JavaScript 实战",
    "tag": "异步",
    "difficulty": 2
  }
}</route>
