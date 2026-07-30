import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { ControlTemplateData } from '@golemui/core';

@Component({
  standalone: true,
  selector: '[gui-label]',
  imports: [CommonModule],
  template: `@if (templateData().label) {
      {{ templateData().label }}
      @if (templateData().validator?.required) {
        <span aria-hidden="true"> *</span>
      }
    }
    @if (templateData().hint) {
      <div class="gui-widget-hint" [id]="uid() + '_hint'">{{ templateData().hint }}</div>
    }
    <ng-content></ng-content>`,
  host: {
    class: 'gui-label',
    '[attr.data-cy]': 'uid() + "_label"',
  },
})
export class LabelComponent<T, ExtraProps extends { hint?: string }> {
  uid = input.required<string>();
  templateData = input.required<ControlTemplateData<T> & ExtraProps>();
}
