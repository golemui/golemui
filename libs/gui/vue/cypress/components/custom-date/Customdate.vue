<script setup lang="ts">
import type { InputWidget, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/vue';
import { computed } from 'vue';

const props = defineProps<WithWidget>();
const widget = props.widget as InputWidget<string>;
const { uid, errors, value, isTouched, onValueChanged, onBlur, injectValidationIssues } =
  useInputWidget<string, Record<string, any>>(widget);

const injectIssues = (ddmmyyyy: string) => {
  if (ddmmyyyy.length === 0) {
    injectValidationIssues(null);
    return;
  }
  const regEx = /^(\d{2})-(\d{2})-(\d{4})$/;
  const results = regEx.exec(ddmmyyyy);
  if (!results) {
    injectValidationIssues(['Invalid date format']);
    return;
  }
  const day = Number(results[1]);
  const month = Number(results[2]);
  const year = Number(results[3]);
  if (day < 1 || day > 31 || month < 1 || month > 12) {
    injectValidationIssues(['Impossible date']);
    return;
  }
  const date = new Date(year, month - 1, day);
  const isValid =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  if (!isValid) {
    injectValidationIssues(['Invalid date']);
    return;
  }
  injectValidationIssues(null);
};

const handleInput = (e: Event) => {
  const next = (e.target as HTMLInputElement).value;
  onValueChanged(next);
  injectIssues(next ?? '');
};

const showErrors = computed(() => isTouched.value && errors.value && errors.value.length > 0);
</script>

<template>
  <div class="gui-customdate">
    <div class="gui-widget">
      <input
        type="text"
        :id="uid"
        :data-cy="`${uid}_customdate`"
        :value="value ?? ''"
        placeholder="dd-mm-yyyy"
        @input="handleInput"
        @blur="onBlur"
      />
    </div>
    <ul
      v-if="showErrors"
      class="gui-validator"
      :id="`${uid}_errors`"
      :data-cy="`${uid}_validator-errors`"
    >
      <li
        v-for="(error, index) in errors"
        :key="index"
        class="gui-validator__error"
        :data-cy="`${uid}_validator-error`"
      >
        {{ error }}
      </li>
    </ul>
  </div>
</template>
