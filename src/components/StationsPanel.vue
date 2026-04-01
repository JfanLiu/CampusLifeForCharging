<script setup lang="ts">
import type { StationCardModel, StationFilter, StationSummaryCard } from '../types';

defineProps<{
  hasOverview: boolean;
  note: string;
  resultsMeta: string;
  summaryCards: StationSummaryCard[];
  cards: StationCardModel[];
  query: string;
  activeFilter: StationFilter;
  loading: boolean;
}>();

const emit = defineEmits<{
  refresh: [];
  shortcutAvailable: [];
  resetFilters: [];
  'update:query': [value: string];
  setFilter: [value: StationFilter];
  expandAll: [];
  collapseAll: [];
  toggleStation: [stationId: string];
}>();

function updateQuery(event: Event) {
  emit('update:query', (event.target as HTMLInputElement).value);
}
</script>

<template>
  <section id="stations-section" class="panel station-panel">
    <div class="panel-head panel-head-spread">
      <div>
        <p class="panel-kicker">地点总览</p>
        <h2>所有地点的充电状态</h2>
      </div>
      <button class="button button-secondary" type="button" :disabled="loading" @click="emit('refresh')">
        {{ loading ? '刷新中...' : '刷新列表' }}
      </button>
    </div>

    <p class="panel-note">
      {{ hasOverview ? note : '地点状态尚未加载。' }}
    </p>

    <div class="station-results-bar">
      <div class="station-results-meta">
        {{
          hasOverview
            ? resultsMeta
            : '还没有地点数据，稍后可点“刷新列表”再试。'
        }}
      </div>
      <div class="station-results-actions">
        <button class="button button-secondary button-small" type="button" @click="emit('shortcutAvailable')">
          只看可充电
        </button>
        <button class="button button-secondary button-small" type="button" @click="emit('resetFilters')">
          清空筛选
        </button>
      </div>
    </div>

    <div class="station-summary">
      <div v-for="item in summaryCards" :key="item.label" class="station-stat">
        <div class="station-stat-label">{{ item.label }}</div>
        <div class="station-stat-value">{{ item.value }}</div>
      </div>
    </div>

    <div class="station-toolbar">
      <label class="field station-search">
        <span>搜索地点</span>
        <input :value="query" type="text" placeholder="搜索楼栋、地点或充电桩" @input="updateQuery" />
      </label>
      <div class="station-toolbar-side">
        <div class="filter-row">
          <button
            class="chip"
            :class="{ 'chip-active': activeFilter === 'all' }"
            type="button"
            @click="emit('setFilter', 'all')"
          >
            全部
          </button>
          <button
            class="chip"
            :class="{ 'chip-active': activeFilter === 'available' }"
            type="button"
            @click="emit('setFilter', 'available')"
          >
            有空位
          </button>
          <button
            class="chip"
            :class="{ 'chip-active': activeFilter === 'busy' }"
            type="button"
            @click="emit('setFilter', 'busy')"
          >
            已占满
          </button>
          <button
            class="chip"
            :class="{ 'chip-active': activeFilter === 'fault' }"
            type="button"
            @click="emit('setFilter', 'fault')"
          >
            设备异常
          </button>
        </div>
        <div class="toolbar toolbar-wrap station-bulk-actions">
          <button class="button button-secondary button-small" type="button" @click="emit('expandAll')">
            展开逐桩
          </button>
          <button class="button button-secondary button-small" type="button" @click="emit('collapseAll')">
            收起逐桩
          </button>
        </div>
      </div>
    </div>

    <div class="station-grid">
      <article v-if="hasOverview && cards.length === 0" class="empty-card">
        当前筛选条件下没有匹配的地点。
      </article>
      <article
        v-for="item in cards"
        :key="item.id"
        class="station-card"
        :class="`status-${item.statusCode || 'unknown'}`"
      >
        <div class="station-card-header">
          <div>
            <h3>{{ item.rname || '未命名地点' }}</h3>
            <p class="muted">地点编号 {{ item.rid || '-' }}</p>
          </div>
          <span class="status-pill" :class="`status-${item.statusCode || 'unknown'}`">
            {{ item.statusLabel || '状态未知' }}
          </span>
        </div>
        <div class="station-meta">
          <span class="meta-pill">空闲 {{ item.freeCount ?? 0 }}</span>
          <span class="meta-pill">充电中 {{ item.chargingCount ?? 0 }}</span>
          <span class="meta-pill">异常 {{ item.errorCount ?? 0 }}</span>
          <span class="meta-pill">总计 {{ item.totalCount ?? 0 }}</span>
        </div>
        <div class="pile-section">
          <div class="pile-section-head">
            <div>
              <div class="muted">逐桩状态</div>
              <div class="pile-preview-note">{{ item.previewText }}</div>
            </div>
            <button
              v-if="item.canToggle"
              class="button button-secondary button-small"
              type="button"
              @click="emit('toggleStation', item.id)"
            >
              {{ item.expanded ? '收起逐桩' : `展开全部 ${item.piles?.length || 0} 根` }}
            </button>
          </div>

          <div v-if="item.visiblePiles.length" class="station-piles">
            <div
              v-for="pile in item.visiblePiles"
              :key="`${item.id}-${pile.name}-${pile.status}`"
              class="pile-item"
              :class="`status-${pile.statusCode || 'unknown'}`"
            >
              <div class="pile-name">{{ pile.name || '未命名充电桩' }}</div>
              <div class="pile-status">{{ pile.statusLabel || pile.status || '状态未知' }}</div>
            </div>
          </div>
          <div v-else class="empty-card">当前地点没有拿到逐桩数据。</div>
        </div>
      </article>
    </div>
  </section>
</template>
