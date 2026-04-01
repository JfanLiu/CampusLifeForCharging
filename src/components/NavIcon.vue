<script setup lang="ts">
defineProps<{
  name: 'home' | 'login' | 'overview' | 'charge' | 'records' | 'stations' | 'more';
}>();
</script>

<template>
  <svg v-if="name === 'home'" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4.5v-5.5h-5V21H5a1 1 0 0 1-1-1v-8.5Z"
      fill="none"
      stroke="currentColor"
      stroke-linejoin="round"
      stroke-width="1.8"
    />
  </svg>

  <svg v-else-if="name === 'login'" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20a7 7 0 0 1 14 0"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="1.8"
    />
  </svg>

  <svg v-else-if="name === 'overview'" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M4 5h7v6H4zM13 5h7v10h-7zM4 13h7v6H4zM13 17h7v2h-7z"
      fill="none"
      stroke="currentColor"
      stroke-linejoin="round"
      stroke-width="1.8"
    />
  </svg>

  <svg v-else-if="name === 'charge'" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M13 2 6 13h5l-1 9 8-12h-5l0-8Z"
      fill="none"
      stroke="currentColor"
      stroke-linejoin="round"
      stroke-width="1.8"
    />
  </svg>

  <svg v-else-if="name === 'records'" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M7 3h8l4 4v13a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
      fill="none"
      stroke="currentColor"
      stroke-linejoin="round"
      stroke-width="1.8"
    />
    <path
      d="M15 3v5h5M9 12h6M9 16h6"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-width="1.8"
    />
  </svg>

  <svg v-else-if="name === 'stations'" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 21s6-5.33 6-11a6 6 0 1 0-12 0c0 5.67 6 11 6 11Z"
      fill="none"
      stroke="currentColor"
      stroke-linejoin="round"
      stroke-width="1.8"
    />
    <circle cx="12" cy="10" r="2.4" fill="none" stroke="currentColor" stroke-width="1.8" />
  </svg>

  <svg v-else viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="6" cy="12" r="1.6" fill="currentColor" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    <circle cx="18" cy="12" r="1.6" fill="currentColor" />
  </svg>
</template>
