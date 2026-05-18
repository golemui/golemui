import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type * as Core from '@golemui/core';

@Component({
  standalone: true,
  selector: '[gui-errors]',
  imports: [CommonModule],
  template: `@for (error of templateData().errors; track $index) {
    <li class="gui-validator__error" role="alert" [attr.data-cy]="uid() + '_validator-error'">
      {{ error }}
    </li>
  }`,
  host: {
    '[attr.id]': 'uid() + "_errors"',
    class: 'gui-validator',
  },
})
export class ErrorsComponent<T, ExtraProps extends { hint?: string }> {
  uid = input.required<string>();
  templateData = input.required<Core.ControlTemplateData<T> & ExtraProps>();
}
