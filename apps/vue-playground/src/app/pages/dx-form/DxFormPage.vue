<script setup lang="ts">
import { FormComponent } from '@golemui/vue';
import type { FormEvent, FormInitConfig, ValidatorFn, WithWidget } from '@golemui/core';
import type { Component } from 'vue';
import { ref } from 'vue';

const widgetLoaders = {
  flex: () => import('./widgets/FlexLayoutDemo.vue').then((m) => m.default),
  textinput: () => import('./widgets/TextInputDemo.vue').then((m) => m.default),
  button: () => import('./widgets/ButtonDemo.vue').then((m) => m.default),
};

const config: FormInitConfig<Component<WithWidget>> = {
  formDef: {
    form: {
      uid: 'root',
      kind: 'layout',
      type: 'flex',
      children: [
        {
          uid: 'email',
          kind: 'input',
          type: 'textinput',
          path: 'email',
          label: 'Email',
        },
        {
          uid: 'name',
          kind: 'input',
          type: 'textinput',
          path: 'name',
          label: 'Name',
        },
        {
          uid: 'submit',
          kind: 'action',
          type: 'button',
          label: 'Submit',
          on: { click: 'submit' },
        },
      ],
    },
  },
  widgetLoaders,
  data: { email: '', name: '' },
};

const eventLog = ref<string[]>([]);
const lastSubmittedData = ref<Record<string, any> | null>(null);

const onFormEvent = (event: FormEvent) => {
  const stamp = new Date().toISOString().split('T')[1].slice(0, 12);
  eventLog.value = [`[${stamp}] ${event.name}`, ...eventLog.value].slice(0, 20);
  if (event.name === 'submit') {
    lastSubmittedData.value = event.data as Record<string, any>;
  }
};

// PR 1 stub: no inputs declare validators yet, so this is never invoked.
// PR 2 wires the real validator factory from @golemui/gui-validators.
const validators = (() => null) as unknown as ValidatorFn<any>;
</script>

<template>
  <section class="dx-form-page">
    <FormComponent :config="config" :validators="validators" @form-event="onFormEvent" />

    <aside class="diagnostics">
      <h3>Form events</h3>
      <ol>
        <li v-for="(line, i) in eventLog" :key="i">{{ line }}</li>
        <li v-if="eventLog.length === 0" class="empty">No events yet</li>
      </ol>

      <h3>Last submitted data</h3>
      <pre>{{ lastSubmittedData ?? '— (click Submit to populate)' }}</pre>
    </aside>
  </section>
</template>

<style scoped>
.dx-form-page {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: start;
}
.diagnostics h3 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
}
.diagnostics ol {
  list-style: none;
  padding: 0;
  margin: 0 0 1rem 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.8125rem;
}
.diagnostics .empty {
  color: #9ca3af;
  font-style: italic;
}
.diagnostics pre {
  background: rgba(15, 23, 42, 0.06);
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.8125rem;
  white-space: pre-wrap;
}
</style>
