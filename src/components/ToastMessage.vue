<script setup lang="ts">
defineProps<{
  visible: boolean;
  tone: 'success' | 'error';
  message: string;
}>();
</script>

<template>
  <div v-if="visible" class="toast" :data-tone="tone">
    {{ message }}
  </div>
</template>
