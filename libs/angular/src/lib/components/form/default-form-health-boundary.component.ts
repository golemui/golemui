import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { FormHealth } from '@golemui/core';

/** Default boundary: red banner when health is errored, nothing otherwise.
 * Override via the `formHealthBoundary` input; receives the current `health`. */
@Component({
  selector: 'gui-default-form-health-boundary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (health().status === 'errored') {
      <div
        class="gui-form-health-error"
        role="alert"
        style="border: 2px solid red; border-radius: 4px; padding: 12px; margin-bottom: 8px"
      >
        <strong style="color: red">GolemUI form error</strong>
        <p style="margin-top: 4px">
          <code>{{ errorMessage() }}</code>
        </p>
      </div>
    }
  `,
})
export class DefaultFormHealthBoundaryComponent {
  health = input.required<FormHealth>();

  protected errorMessage = computed(() => {
    const current = this.health();
    return current.status === 'errored' ? current.message : '';
  });
}
