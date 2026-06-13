import type { FormHealth } from '@golemui/core';
import { html, nothing, type TemplateResult } from 'lit';

/**
 * Params for a FormHealth boundary. `health` is the form's current health; `form` is the rendered
 * form template - place it in the output so it stays mounted and a recovered health clears the error.
 */
export interface FormHealthBoundaryParams {
  health: FormHealth;
  form: TemplateResult;
}

/**
 * Renders the form wrapped with error UI driven by {@link FormHealth}. Set via the `formHealthBoundary`
 * property on `gui-core-form` / `gui-form`; defaults to {@link defaultFormHealthBoundary}.
 *
 * @example
 * const myBoundary: FormHealthBoundary = ({ health, form }) => html`
 *   ${health.status === 'errored' ? html`<my-banner .message=${health.message}></my-banner>` : nothing}
 *   ${form}
 * `;
 */
export type FormHealthBoundary = (params: FormHealthBoundaryParams) => unknown;

/** Default boundary: prepends a red banner when health is errored, otherwise renders the form alone. Override via the `formHealthBoundary` property. */
export const defaultFormHealthBoundary: FormHealthBoundary = ({ health, form }) => html`
  ${health.status === 'errored'
    ? html`<div
        class="gui-form-health-error"
        role="alert"
        style="border: 2px solid red; border-radius: 4px; padding: 12px; margin-bottom: 8px;"
      >
        <strong style="color: red;">GolemUI form error</strong>
        <p style="margin-top: 4px;"><code>${health.message}</code></p>
      </div>`
    : nothing}
  ${form}
`;
