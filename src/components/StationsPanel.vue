<script setup lang="ts">
import { computed } from 'vue';
import type { StationCardModel, StationFilter, StationSummaryCard } from '../types';

const props = defineProps<{
  hasOverview: boolean;
  mobileLayout: boolean;
  note: string;
  resultsMeta: string;
  summaryCards: StationSummaryCard[];
  cards: StationCardModel[];
  selectedStation: StationCardModel | null;
  query: string;
  activeFilter: StationFilter;
  loading: boolean;
}>();

const hasSelection = computed(() => Boolean(props.selectedStation));
const selectedPiles = computed(() => props.selectedStation?.piles || []);

const emit = defineEmits<{
  refresh: [];
  shortcutAvailable: [];
  resetFilters: [];
  'update:query': [value: string];
  setFilter: [value: StationFilter];
  selectStation: [stationId: string];
  clearSelection: [];
}>();

function updateQuery(event: Event) {
  emit('update:query', (event.target as HTMLInputElement).value);
}

function formatStationSummaryLine(item: StationCardModel) {
  return [
    `空闲 ${item.freeCount ?? 0}`,
    `充电中 ${item.chargingCount ?? 0}`,
    `异常 ${item.errorCount ?? 0}`,
    `总计 ${item.totalCount ?? 0}`,
  ].join(' · ');
}
</script>

<template>
  <section id="stations-section" class="panel station-panel">
    <div class="panel-head panel-head-spread">
      <div>
        <p class="panel-kicker">地点总览</p>
        <h2>先选地点，再看逐桩详情</h2>
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
        <input :value="query" type="text" placeholder="搜索楼栋或地点名称" @input="updateQuery" />
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
      </div>
    </div>

    <div
      class="station-browser"
      :class="{
        'station-browser-mobile-list': mobileLayout && !hasSelection,
        'station-browser-mobile-detail': mobileLayout && hasSelection,
      }"
    >
      <div class="station-list-panel">
        <article v-if="!hasOverview" class="empty-card">
          还没有地点数据，稍后可点“刷新列表”再试。
        </article>
        <article v-else-if="cards.length === 0" class="empty-card">
          当前筛选条件下没有匹配的地点。
        </article>
        <template v-else>
          <button
            v-for="item in cards"
            :key="item.id"
            class="station-list-row"
            :class="{
              'station-list-row-active': selectedStation?.id === item.id,
              [`status-${item.statusCode || 'unknown'}`]: true,
            }"
            type="button"
            @click="emit('selectStation', item.id)"
          >
            <div class="station-list-main">
              <h3>{{ item.rname || '未命名地点' }}</h3>
              <span class="status-pill" :class="`status-${item.statusCode || 'unknown'}`">
                {{ item.statusLabel || '状态未知' }}
              </span>
            </div>
            <p class="station-summary-line">{{ formatStationSummaryLine(item) }}</p>
          </button>
        </template>
      </div>

      <div class="station-detail-panel">
        <article
          v-if="selectedStation"
          class="station-detail-card"
          :class="`status-${selectedStation.statusCode || 'unknown'}`"
        >
          <div class="station-detail-title">
            <button
              v-if="mobileLayout"
              class="button button-secondary button-small station-detail-back"
              type="button"
              @click="emit('clearSelection')"
            >
              返回地点列表
            </button>
            <p class="panel-kicker">地点详情</p>
            <div class="station-detail-head">
              <h3>{{ selectedStation.rname || '未命名地点' }}</h3>
              <span class="status-pill" :class="`status-${selectedStation.statusCode || 'unknown'}`">
                {{ selectedStation.statusLabel || '状态未知' }}
              </span>
            </div>
            <p class="station-summary-line station-summary-line-detail">
              {{ formatStationSummaryLine(selectedStation) }}
            </p>
          </div>

          <div class="station-detail-piles">
            <article v-if="selectedPiles.length === 0" class="empty-card">
              当前地点没有拿到逐桩数据。
            </article>
            <template v-else>
              <article
                v-for="pile in selectedPiles"
                :key="`${selectedStation.id}-${pile.name}-${pile.status}`"
                class="pile-detail-item"
                :class="`status-${pile.statusCode || 'unknown'}`"
              >
                <div class="pile-detail-top">
                  <div class="pile-name">{{ pile.name || '未命名充电桩' }}</div>
                </div>
                <p class="pile-note">
                  {{ pile.note || pile.statusLabel || pile.status || '状态未知' }}
                </p>
              </article>
            </template>
          </div>
        </article>

        <article v-else class="empty-card station-detail-empty">
          从地点列表里选一个位置，再查看该地点每根充电桩的详细状态。
        </article>
      </div>
    </div>
  </section>
</template>
