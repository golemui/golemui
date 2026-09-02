import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { FormHealth } from '@golemui/core';

@Component({
  selector: 'app-custom-form-health-boundary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (health().status === 'errored') {
      <div role="alert" class="custom-form-health-error">
        <strong>This form could not be loaded</strong>
        <div>{{ errorMessage() }}</div>
      </div>
    }
  `,
  styles: [
    `
      .custom-form-health-error {
        padding: 0.75rem 1rem;
        margin-bottom: 0.5rem;
        border-left: 4px solid #b91c1c;
        border-radius: 4px;
        background: #fef2f2;
        color: #b91c1c;
      }
    `,
  ],
})
export class CustomFormHealthBoundaryComponent {
  health = input.required<FormHealth>();

  protected errorMessage = computed(() => {
    const current = this.health();
    return current.status === 'errored' ? current.message : '';
  });
}
