<script setup lang="ts">
import DxFormPage from './pages/dx-form/DxFormPage.vue';
</script>

<template>
  <main class="container">
    <h1>Vue Playground (PR 1 stub)</h1>
    <p>
      This stub exercises <code>@golemui/vue</code> end-to-end using three inline demo widgets.
      The full widget set lands in PR 2 as <code>@golemui/gui-vue</code>.
    </p>
    <DxFormPage />
  </main>
</template>

<style>
.container h1 {
  margin: 0 0 0.5rem 0;
}
.container > p {
  color: var(--gui-text-muted, #6b7280);
  margin-bottom: 1.5rem;
}
</style>
