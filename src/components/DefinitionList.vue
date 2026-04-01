<script setup lang="ts">
import type { DefinitionRow } from '../types';

defineProps<{
  rows: DefinitionRow[];
}>();
</script>

<template>
  <div class="definition-list">
    <div v-for="row in rows" :key="row.term" class="definition-row">
      <div class="definition-term">{{ row.term }}</div>
      <div class="definition-value">{{ row.value || '-' }}</div>
    </div>
  </div>
</template>
