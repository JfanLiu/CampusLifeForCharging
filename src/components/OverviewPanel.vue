<script setup lang="ts">
import { ref, watch } from 'vue';
import NavIcon from './NavIcon.vue';
import type { DashboardStat, UserProfile } from '../types';

const props = defineProps<{
  profile: UserProfile | null;
  initials: string;
  stats: DashboardStat[];
  refreshBusy: boolean;
}>();

const emit = defineEmits<{
  logout: [];
  refresh: [];
  navigate: [targetId: string, tab: 'overview' | 'charge' | 'records' | 'stations' | 'more'];
}>();

const avatarFailed = ref(false);

watch(
  () => props.profile?.avatar,
  () => {
    avatarFailed.value = false;
  },
  { immediate: true },
);
</script>

<template>
  <section class="panel overview-panel">
    <div class="overview-shell">
      <div class="profile-card">
        <div class="profile-meta">
          <p class="panel-kicker">当前会话</p>
          <h2>{{ profile?.username || '未登录' }}</h2>
          <p class="muted">{{ profile?.phone || '-' }}</p>
        </div>
        <div class="avatar-shell">
          <img
            v-if="profile?.avatar && !avatarFailed"
            :src="profile.avatar"
            :alt="profile.username || 'avatar'"
            referrerpolicy="no-referrer"
            @error="avatarFailed = true"
          />
          <template v-else>{{ initials }}</template>
        </div>
      </div>

      <div class="session-actions toolbar toolbar-wrap">
        <button
          class="button button-secondary"
          type="button"
          @click="emit('navigate', 'charge-section', 'charge')"
        >
          开始充电
        </button>
        <button
          class="button button-secondary"
          type="button"
          @click="emit('navigate', 'records-section', 'records')"
        >
          查看记录
        </button>
        <button
          class="button button-secondary"
          type="button"
          @click="emit('navigate', 'stations-section', 'stations')"
        >
          地点状态
        </button>
        <button
          class="button button-secondary"
          type="button"
          @click="emit('navigate', 'tools-section', 'more')"
        >
          使用说明
        </button>
        <button class="button button-danger" type="button" @click="emit('logout')">
          退出登录
        </button>
      </div>
    </div>

    <div class="overview-quick-grid">
      <button class="overview-quick-action" type="button" @click="emit('refresh')" :disabled="refreshBusy">
        <span class="overview-quick-icon" aria-hidden="true">
          <NavIcon name="refresh" />
        </span>
        <span class="overview-quick-copy">
          <strong>{{ refreshBusy ? '更新中...' : '刷新总览' }}</strong>
          <span>余额、状态和地点一起刷新</span>
        </span>
      </button>
      <button
        class="overview-quick-action"
        type="button"
        @click="emit('navigate', 'charge-section', 'charge')"
      >
        <span class="overview-quick-icon" aria-hidden="true">
          <NavIcon name="charge" />
        </span>
        <span class="overview-quick-copy">
          <strong>前往充电</strong>
          <span>扫码或输入编号都可以</span>
        </span>
      </button>
      <button
        class="overview-quick-action"
        type="button"
        @click="emit('navigate', 'records-section', 'records')"
      >
        <span class="overview-quick-icon" aria-hidden="true">
          <NavIcon name="records" />
        </span>
        <span class="overview-quick-copy">
          <strong>本月记录</strong>
          <span>快速看看最近都充了什么</span>
        </span>
      </button>
      <button
        class="overview-quick-action"
        type="button"
        @click="emit('navigate', 'stations-section', 'stations')"
      >
        <span class="overview-quick-icon" aria-hidden="true">
          <NavIcon name="stations" />
        </span>
        <span class="overview-quick-copy">
          <strong>空闲地点</strong>
          <span>马上看哪里还有可用位置</span>
        </span>
      </button>
    </div>

    <div class="dashboard-stats">
      <article v-for="item in stats" :key="item.label" class="snapshot-card">
        <div class="snapshot-label">{{ item.label }}</div>
        <div class="snapshot-value">{{ item.value }}</div>
        <div class="snapshot-caption">{{ item.caption }}</div>
      </article>
    </div>
  </section>
</template>
