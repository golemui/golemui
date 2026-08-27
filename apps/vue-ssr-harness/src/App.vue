<script setup lang="ts">
import type { FormSubmitEvent } from '@golemui/core';
import { gui, type DxDefinitionItem, type GuiFormInitConfig } from '@golemui/gui-shared';
import { GuiForm } from '@golemui/gui-vue';
import { onMounted, ref } from 'vue';

// A small form that keeps the server markup stable. No tabs, no markdown, and no calendar,
// so the render does not depend on the server clock. The widget internals are not server
// rendered, so each field only becomes usable once Lit upgrades its custom element.
const formDef: DxDefinitionItem[] = [
  gui.layouts.flex(
    [
      gui.inputs.textInput('firstName', {
        label: 'First name',
        placeholder: 'Ada',
        validator: { required: true, minLength: 2 },
      }),
      gui.inputs.textInput('lastName', {
        label: 'Last name',
        placeholder: 'Lovelace',
        validator: { required: true, minLength: 2 },
      }),
    ],
    { direction: 'row', gap: 16 },
  ),
  gui.inputs.numberInput('seats', {
    label: 'Seats',
    validator: { required: true, minimum: 1 },
  }),
  gui.inputs.select('plan', {
    label: 'Plan',
    options: [
      { value: 'free', label: 'Free' },
      { value: 'pro', label: 'Pro' },
      { value: 'enterprise', label: 'Enterprise' },
    ],
    validator: { type: 'string', required: true },
  }),
  gui.inputs.checkbox('acceptTerms', {
    label: 'I accept the terms',
    validator: { required: true },
  }),
  gui.actions.button({
    label: 'Create account',
    actionType: 'submit',
  }),
];

// An explicit formName keeps the form id identical on the server and the client,
// including on Vue versions before 3.5.
const config: GuiFormInitConfig = {
  formName: 'harness-form',
  formDef,
  data: {
    firstName: 'Ada',
    lastName: 'Lovelace',
    seats: 3,
    plan: 'pro',
    acceptTerms: false,
  },
};

// Starts false so the first client render matches the server markup. onMounted runs after
// hydration, so the label flips only once the client has taken over.
const hydrated = ref(false);
onMounted(() => {
  hydrated.value = true;
});

const onFormSubmit = (event: FormSubmitEvent) => {
  console.log('form submitted', event.data);
};
</script>

<template>
  <div class="harness">
    <h1 class="harness__title">Vue server rendering harness</h1>
    <p class="harness__status" :data-hydrated="hydrated">
      {{ hydrated ? 'Hydrated on the client' : 'Server HTML, not yet hydrated' }}
    </p>
    <p class="harness__note">
      The Vue layer is server rendered. The widget internals are not, so every gui-* element
      arrives empty and Lit fills it in when the browser upgrades it. View source to see it.
    </p>
    <GuiForm :config="config" @form-submit="onFormSubmit" />
  </div>
</template>
