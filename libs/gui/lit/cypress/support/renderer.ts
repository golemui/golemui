import { type RenderTextFn } from '@golemui/ui-testing';
import { html } from 'lit';

/** Builds a span with the class `renderer-text` for the renderer display tests. */
export const renderText: RenderTextFn = (text) => html`<span class="renderer-text">${text}</span>`;
