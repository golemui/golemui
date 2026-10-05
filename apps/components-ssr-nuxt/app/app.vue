<script setup lang="ts">
import { onMounted, ref } from 'vue';
// The elements the page uses. On the server they register in lit's DOM shim, in the browser they
// upgrade the server markup.
import '@golemui/gui-components/alert';
import '@golemui/gui-components/button';
import '@golemui/gui-components/checkbox';
import '@golemui/gui-components/date-picker';
import '@golemui/gui-components/select';
import '@golemui/gui-components/tab';
import '@golemui/gui-components/tab-list';
import '@golemui/gui-components/tab-panel';
import '@golemui/gui-components/tabs';
import '@golemui/gui-components/textinput';

// The same page in every components-ssr-* app (see components-ssr-react/src/App.tsx).
const plans = [
  { label: 'Starter', value: 'starter' },
  { label: 'Team', value: 'team' },
];

// Starts false so the first client render matches the server markup. onMounted runs after
// hydration only.
const hydrated = ref(false);
const email = ref('ada@example.com');
onMounted(() => (hydrated.value = true));

const onEmailInput = (event: Event) => {
  email.value = (event as CustomEvent<{ value?: string }>).detail.value ?? '';
};
</script>

<template>
  <main class="page">
    <h1>GolemUI Components: Nuxt server rendering</h1>
    <p class="page__status" :data-hydrated="hydrated">
      {{ hydrated ? 'Hydrated on the client' : 'Server HTML, not yet hydrated' }}
    </p>
    <gui-alert variant="info">Yearly billing saves two months.</gui-alert>
    <form id="checkout">
      <gui-textinput
        uid="email"
        name="email"
        label="Email"
        hint="We send the receipt here."
        required
        :value="email"
        @gui-input="onEmailInput"
      ></gui-textinput>
      <p class="page__readout" data-readout>Email: {{ email }}</p>
      <gui-select
        uid="plan"
        name="plan"
        label="Plan"
        :options.prop="plans"
        value="team"
      ></gui-select>
      <gui-date-picker
        uid="start"
        name="start"
        label="Start date"
        value="2026-11-02"
      ></gui-date-picker>
      <gui-tabs active="billing">
        <gui-tab-list aria-label="Checkout">
          <gui-tab panel="billing">Billing</gui-tab>
          <gui-tab panel="company">Company</gui-tab>
        </gui-tab-list>
        <gui-tab-panel name="billing">
          <gui-checkbox
            uid="terms"
            name="terms"
            label="I accept the terms"
            :value="true"
          ></gui-checkbox>
        </gui-tab-panel>
        <gui-tab-panel name="company">
          <gui-textinput
            uid="company"
            name="company"
            label="Company"
            value="Analytical Engines"
          ></gui-textinput>
        </gui-tab-panel>
      </gui-tabs>
      <gui-button label="Pay 49 EUR" type="submit"></gui-button>
    </form>
  </main>
</template>
