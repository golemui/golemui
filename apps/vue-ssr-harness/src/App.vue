<script setup lang="ts">
import type { FormSubmitEvent } from '@golemui/core';
import { gui, type DxDefinitionItem, type GuiFormInitConfig } from '@golemui/gui-shared';
import { GuiForm } from '@golemui/gui-vue';

// A small form that is fully visible without JavaScript
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

const onFormSubmit = (event: FormSubmitEvent) => {
  console.log('form submitted', event.data);
};
</script>

<template>
  <div class="harness">
    <h1 class="harness__title">Vue server rendering harness</h1>
    <GuiForm :config="config" @form-submit="onFormSubmit" />
  </div>
</template>
