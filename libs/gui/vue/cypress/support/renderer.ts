import { type RenderTextFn } from '@golemui/ui-testing';
import { h } from 'vue';

/** Builds a span with the class `renderer-text` for the renderer display tests. */
export const renderText: RenderTextFn = (text) => h('span', { class: 'renderer-text' }, text);
