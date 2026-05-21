<script setup lang="ts">
defineProps<{
  errors: string[];
  uid: string;
}>();
</script>

<template>
  <ul class="gui-validator" :id="`${uid}_errors`" :data-cy="`${uid}_validator-errors`">
    <li
      v-for="(error, index) in errors"
      :key="index"
      class="gui-validator__error"
      role="alert"
      :data-cy="`${uid}_validator-error`"
    >
      {{ error }}
    </li>
  </ul>
</template>
