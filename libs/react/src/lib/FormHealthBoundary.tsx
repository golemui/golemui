import type { FormHealth } from '@golemui/core';
import type { ComponentType, ReactNode } from 'react';

/**
 * Props for a FormHealth boundary. `health` is the form's current health; `children` is the rendered
 * form - keep it mounted so a recovered health (e.g. a corrected config) restores the form in place.
 * Render `children` at the same child position and inside the same parent element for every health.
 * A different position or parent makes React build a new form, and the focus and the typed text are
 * lost.
 */
export interface FormHealthBoundaryProps {
  health: FormHealth;
  children: ReactNode;
}

/**
 * Wraps the form and renders error UI based on {@link FormHealth}. Pass via the `formHealthBoundary`
 * prop on `FormComponent` / `GuiForm`; defaults to {@link DefaultFormHealthBoundary}.
 *
 * The banner expression keeps its child position also when it is `false`, so `children` is always the
 * second child.
 *
 * @example
 * const MyBoundary: FormHealthBoundary = ({ health, children }) => (
 *   <>
 *     {health.status === 'errored' && <Banner>{health.message}</Banner>}
 *     {children}
 *   </>
 * );
 */
export type FormHealthBoundary = ComponentType<FormHealthBoundaryProps>;

/**
 * Default boundary: renders a red banner before the form when health is errored. The banner slot is
 * empty for other health values, so the form is always the second child. Override via the
 * `formHealthBoundary` prop.
 */
export function DefaultFormHealthBoundary({ health, children }: FormHealthBoundaryProps) {
  return (
    <>
      {health.status === 'errored' ? (
        <div
          className="gui-form-health-error"
          role="alert"
          style={{ border: '2px solid red', borderRadius: 4, padding: 12, marginBottom: 8 }}
        >
          <strong style={{ color: 'red' }}>GolemUI form error</strong>
          <p style={{ marginTop: 4 }}>
            <code>{health.message}</code>
          </p>
        </div>
      ) : null}
      {children}
    </>
  );
}
