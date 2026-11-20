<script setup lang="ts">
import type { FormSubmitEvent } from '@golemui/core';
import type { GuiFormInitConfig } from '@golemui/gui-shared';
import { GuiForm } from '@golemui/gui-vue';
import { onMounted, ref } from 'vue';

// A small form that keeps the server markup stable. No tabs, no markdown, and no calendar,
// so the render does not depend on the server clock. The widget internals are not server
// rendered, so each field only becomes usable once Lit upgrades its custom element.
const formDef = {
  form: [
    {
      kind: 'layout',
      type: 'grid',
      props: { direction: 'row' },
      children: [
        {
          kind: 'input',
          type: 'textinput',
          uid: 'firstName',
          path: 'firstName',
          label: 'First name',
          validator: { type: 'string', required: true, minLength: 2 },
          props: { placeholder: 'Ada' },
        },
        {
          kind: 'input',
          type: 'textinput',
          uid: 'lastName',
          path: 'lastName',
          label: 'Last name',
          validator: { type: 'string', required: true, minLength: 2 },
          props: { placeholder: 'Lovelace' },
        },
      ],
    },
    {
      kind: 'input',
      type: 'number',
      uid: 'seats',
      path: 'seats',
      label: 'Seats',
      validator: { type: 'number', required: true, minimum: 1 },
      props: { placeholder: 'seats' },
    },
    {
      kind: 'input',
      type: 'select',
      uid: 'plan',
      path: 'plan',
      label: 'Plan',
      validator: { type: 'string', required: true },
      props: {
        options: [
          { value: 'free', label: 'Free' },
          { value: 'pro', label: 'Pro' },
          { value: 'enterprise', label: 'Enterprise' },
        ],
        placeholder: 'plan',
      },
    },
    {
      kind: 'input',
      type: 'checkbox',
      uid: 'acceptTerms',
      path: 'acceptTerms',
      label: 'I accept the terms',
      validator: { type: 'boolean', required: true },
    },
    {
      kind: 'action',
      type: 'button',
      label: 'Create account',
      actionType: 'submit',
    },
  ],
};

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
      The Vue layer is server rendered. The widget internals are not, so every gui-* element arrives
      empty and Lit fills it in when the browser upgrades it. View source to see it.
    </p>
    <GuiForm :config="config" @form-submit="onFormSubmit" />
  </div>
</template>
