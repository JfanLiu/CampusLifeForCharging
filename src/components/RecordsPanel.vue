<script setup lang="ts">
import type { RecordCardModel, RecordSummaryCard } from '../types';

defineProps<{
  year: string;
  month: string;
  busy: boolean;
  activePreset: '' | 'current' | 'previous';
  summaryCards: RecordSummaryCard[];
  recordCards: RecordCardModel[];
}>();

const emit = defineEmits<{
  'update:year': [value: string];
  'update:month': [value: string];
  submit: [];
  preset: [preset: 'current' | 'previous'];
}>();

function updateYear(event: Event) {
  emit('update:year', (event.target as HTMLInputElement).value);
}

function updateMonth(event: Event) {
  emit('update:month', (event.target as HTMLInputElement).value);
}
</script>

<template>
  <section id="records-section" class="panel">
    <div class="panel-head">
      <div>
        <p class="panel-kicker">记录</p>
        <h2>月度充电记录</h2>
      </div>
    </div>
    <div class="records-query-card">
      <div class="records-query-copy">
        <p class="panel-note">默认显示当前月份，也可以切到上个月，或者手动指定年份和月份查询。</p>
      </div>
      <div class="record-presets">
        <button
          class="chip"
          :class="{ 'chip-active': activePreset === 'current' }"
          type="button"
          @click="emit('preset', 'current')"
        >
          本月
        </button>
        <button
          class="chip"
          :class="{ 'chip-active': activePreset === 'previous' }"
          type="button"
          @click="emit('preset', 'previous')"
        >
          上月
        </button>
      </div>
      <form class="record-form" @submit.prevent="emit('submit')">
        <label class="field compact-field">
          <span>年份</span>
          <input :value="year" type="text" inputmode="numeric" maxlength="4" required @input="updateYear" />
        </label>
        <label class="field compact-field">
          <span>月份</span>
          <input :value="month" type="text" inputmode="numeric" maxlength="2" required @input="updateMonth" />
        </label>
        <button class="button button-secondary" type="submit" :disabled="busy">
          {{ busy ? '查询中...' : '查询记录' }}
        </button>
      </form>
    </div>

    <div class="records-summary">
      <article v-for="item in summaryCards" :key="item.label" class="record-summary-card">
        <div class="record-summary-label">{{ item.label }}</div>
        <div class="record-summary-value">{{ item.value }}</div>
        <div class="record-summary-caption">{{ item.caption }}</div>
      </article>
    </div>

    <div class="record-list">
      <article v-if="recordCards.length === 0" class="empty-card">
        {{ year }}-{{ month.padStart(2, '0') }} 暂无记录
      </article>
      <article
        v-for="(card, index) in recordCards"
        v-else
        :key="`${card.timeText}-${index}`"
        class="record-card"
        :class="`record-tone-${card.tone}`"
      >
        <div class="record-card-head">
          <div class="record-time-badge">{{ card.timeText }}</div>
          <span v-if="card.statusText" class="record-status-chip" :class="`record-status-${card.tone}`">
            {{ card.statusText }}
          </span>
        </div>
        <h3>{{ card.title }}</h3>
        <p class="record-subtitle">{{ card.subtitle }}</p>
        <div v-if="card.highlights.length" class="record-highlight-row">
          <div
            v-for="item in card.highlights"
            :key="`${card.title}-${item.label}`"
            class="record-highlight"
            :class="`record-highlight-${item.tone}`"
          >
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </div>
        <div v-if="card.facts.length" class="record-fact-grid">
          <div v-for="item in card.facts" :key="`${card.title}-${item.label}`" class="record-fact">
            <div class="record-fact-label">{{ item.label }}</div>
            <div class="record-fact-value">{{ item.value }}</div>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
