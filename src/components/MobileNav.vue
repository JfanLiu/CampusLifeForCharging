<script setup lang="ts">
import { computed } from 'vue';
import NavIcon from './NavIcon.vue';
import type { MobileTab } from '../types';

const props = defineProps<{
  loggedIn: boolean;
  mobileLayout: boolean;
  activeTab: MobileTab;
}>();

const emit = defineEmits<{
  navigate: [targetId: string, tab: MobileTab];
}>();

const items = computed(() =>
  props.loggedIn
    ? [
        { tab: 'overview' as const, targetId: 'dashboard-view', label: '总览', icon: 'overview' as const },
        { tab: 'charge' as const, targetId: 'charge-section', label: '充电', icon: 'charge' as const },
        { tab: 'records' as const, targetId: 'records-section', label: '记录', icon: 'records' as const },
        { tab: 'stations' as const, targetId: 'stations-section', label: '地点', icon: 'stations' as const },
        { tab: 'more' as const, targetId: 'tools-section', label: '更多', icon: 'more' as const },
      ]
    : [
        { tab: 'welcome' as const, targetId: 'hero-section', label: '首页', icon: 'home' as const },
        { tab: 'login' as const, targetId: 'login-view', label: '登录', icon: 'login' as const },
        { tab: 'stations' as const, targetId: 'stations-section', label: '地点', icon: 'stations' as const },
      ],
);
</script>

<template>
  <nav v-if="mobileLayout" class="mobile-nav" aria-label="移动端快速导航">
    <button
      v-for="item in items"
      :key="item.tab"
      class="mobile-nav-item"
      :class="{ 'mobile-nav-item-active': activeTab === item.tab }"
      type="button"
      :aria-current="activeTab === item.tab ? 'page' : 'false'"
      @click="emit('navigate', item.targetId, item.tab)"
    >
      <span class="mobile-nav-icon" aria-hidden="true">
        <NavIcon :name="item.icon" />
      </span>
      <span class="mobile-nav-label">{{ item.label }}</span>
    </button>
  </nav>
</template>
