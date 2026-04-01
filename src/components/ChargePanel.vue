<script setup lang="ts">
import type { ChargeQuickItem } from '../types';

defineProps<{
  qrcode: string;
  busy: boolean;
  contextNote: string;
  quickItems: ChargeQuickItem[];
}>();

const emit = defineEmits<{
  'update:qrcode': [value: string];
  submit: [];
  openScanner: [];
  focusInput: [];
}>();

function updateQrcode(event: Event) {
  emit('update:qrcode', (event.target as HTMLInputElement).value);
}
</script>

<template>
  <section id="charge-section" class="panel panel-highlight">
    <div class="panel-head">
      <div>
        <p class="panel-kicker">充电</p>
        <h2>输入编号或扫码</h2>
      </div>
    </div>
    <p class="panel-note">支持扫码和手动输入两种方式，选择你觉得方便的就可以。</p>
    <div class="charge-focus-card">
      <div class="charge-focus-copy">
        <p class="panel-kicker">现场操作</p>
        <h3>扫码或输入编号都可以，保持简单直接。</h3>
        <p class="panel-note">{{ contextNote }}</p>
      </div>
      <div class="charge-focus-actions">
        <button class="button button-primary charge-scan-button" type="button" @click="emit('openScanner')">
          打开扫码
        </button>
        <button class="button button-secondary charge-manual-button" type="button" @click="emit('focusInput')">
          输入编号
        </button>
      </div>
      <div class="charge-quick-meta">
        <div
          v-for="item in quickItems"
          :key="`${item.label}-${item.value}`"
          class="charge-meta-pill"
          :class="`charge-meta-${item.tone}`"
        >
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </div>
    </div>
    <form class="form-stack" @submit.prevent="emit('submit')">
      <label class="field">
        <span>二维码后 8 位</span>
        <input
          id="charge-qrcode"
          :value="qrcode"
          name="qrcode"
          type="text"
          inputmode="numeric"
          placeholder="例如 12345678"
          required
          @input="updateQrcode"
        />
      </label>
      <div class="toolbar toolbar-wrap">
        <button class="button button-primary" type="submit" :disabled="busy">
          {{ busy ? '提交中...' : '开始充电' }}
        </button>
        <button class="button button-secondary" type="button" @click="emit('openScanner')">
          打开扫码
        </button>
      </div>
    </form>
    <p class="panel-note">如果当前浏览器支持网页扫码，会直接调用相机；如果不支持，请改用手动输入编号。</p>
  </section>
</template>
