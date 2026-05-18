import { FormContext, type WithWidget } from '@golemui/core';
import type { Component } from 'vue';

export class VueFormContext extends FormContext<Component<WithWidget>> {}
