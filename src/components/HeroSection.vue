<script setup lang="ts">
const emit = defineEmits<{
  navigate: [targetId: string, tab: 'welcome' | 'login' | 'stations'];
}>();
</script>

<template>
  <section id="hero-section" class="hero panel">
    <div class="hero-copy-block">
      <p class="eyebrow">Mobile-First Charging Portal</p>
      <h2>给苹果手机用户一个更方便的校园充电入口。</h2>
      <p class="hero-copy">
        这个网页版本专注于登录、查余额、看地点状态、扫码或输入编号发起充电，以及查看月度记录。
        需要充值时，仍然回到官方 App 完成，避免把浏览器做成一个看起来能付、实际上付不通的入口。
      </p>
      <div class="hero-actions">
        <button
          class="button button-primary"
          type="button"
          @click="emit('navigate', 'login-view', 'login')"
        >
          登录校园账户
        </button>
        <button
          class="button button-secondary"
          type="button"
          @click="emit('navigate', 'stations-section', 'stations')"
        >
          查看地点状态
        </button>
      </div>
    </div>

    <div class="hero-aside">
      <article class="capability-card">
        <p class="panel-kicker">日常够用</p>
        <h3>登录、查余额、看状态、直接充电</h3>
        <p>
          日常最常用的动作都保留在浏览器里，适合临时打开快速判断哪里有空闲桩、当前是否正在充电、余额够不够。
        </p>
      </article>
      <article class="capability-card capability-card-alert">
        <p class="panel-kicker">充值说明</p>
        <h3>充值仍需在官方 App 中完成</h3>
        <p>
          目前官方支付流程仍依赖 App 内能力，所以网页只负责查余额和刷新结果，不会误导你在浏览器里反复尝试支付。
        </p>
      </article>
    </div>
  </section>
</template>
