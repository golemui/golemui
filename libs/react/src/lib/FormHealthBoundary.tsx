import type { FormHealth } from '@golemui/core';
import type { ComponentType, ReactNode } from 'react';

/**
 * Props for a FormHealth boundary. `health` is the form's current health; `children` is the rendered
 * form - keep it mounted so a recovered health (e.g. a corrected config) restores the form in place.
 */
export interface FormHealthBoundaryProps {
  health: FormHealth;
  children: ReactNode;
}

/**
 * Wraps the form and renders error UI based on {@link FormHealth}. Pass via the `formHealthBoundary`
 * prop on `FormComponent` / `GuiForm`; defaults to {@link DefaultFormHealthBoundary}.
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

/** Default boundary: prepends a red banner when health is errored, otherwise renders the form alone. Override via the `formHealthBoundary` prop. */
export function DefaultFormHealthBoundary({ health, children }: FormHealthBoundaryProps) {
  if (health.status !== 'errored') {
    return <>{children}</>;
  }
  return (
    <>
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
      {children}
    </>
  );
}
