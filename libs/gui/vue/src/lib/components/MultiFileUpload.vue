<script setup lang="ts">
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/vue';
import type { FileItem, MultiFileUploadProps } from '@golemui/gui-shared/internals';
import { computed } from 'vue';
import '@golemui/gui-components/multi-file-upload';

const props = defineProps<WithWidget>();
const widget = props.widget as InputWidget<FileItem[]>;
const {
  uid,
  errors,
  value,
  isTouched,
  templateData,
  onValueChanged,
  onBlur,
  injectValidationIssues,
} = useInputWidget<FileItem[], MultiFileUploadProps>(widget);

const handleChange = (e: Event) => onValueChanged((e as CustomEvent).detail.value as FileItem[]);

const handleInputError = (e: Event) => {
  const message = (e as CustomEvent).detail.message as string | null;
  injectValidationIssues(message ? [message] : null);
};

const required = computed(() => (templateData.value.validator as Validator)?.required);
</script>

<template>
  <div class="gui-multi-file-upload gui-field" :style="{ flex: templateData.size }">
    <gui-multi-file-upload
      :uid="uid"
      :path="widget.path"
      :label="templateData.label"
      :hint="templateData.hint"
      :errors="errors"
      :touched="isTouched"
      :required="required"
      :disabled="templateData.disabled"
      :readOnly="templateData.readonly"
      :values="value ?? []"
      :dependencies="templateData.deps"
      :icon="templateData.icon"
      :accept="templateData.accept"
      :maxSize="templateData.maxSize"
      :buttonLabel="templateData.buttonLabel"
      :removeAriaLabel="templateData.removeAriaLabel"
      :cancelAriaLabel="templateData.cancelAriaLabel"
      :retryAriaLabel="templateData.retryAriaLabel"
      :removeIcon="templateData.removeIcon"
      :retryIcon="templateData.retryIcon"
      :maxSizeMessage="templateData.maxSizeMessage"
      :acceptMessage="templateData.acceptMessage"
      :interruptedMessage="templateData.interruptedMessage"
      :missingServiceMessage="templateData.missingServiceMessage"
      :uploadedMessage="templateData.uploadedMessage"
      :removedMessage="templateData.removedMessage"
      :failedMessage="templateData.failedMessage"
      @change="handleChange"
      @blur="onBlur"
      @inputError="handleInputError"
    ></gui-multi-file-upload>
  </div>
</template>
