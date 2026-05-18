import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { ControlTemplateData } from '@golemui/core'

@Component({
  standalone: true,
  selector: '[gui-icon]',
  imports: [CommonModule],
  template: ``,
  host: {
    class: 'gui-widget-icon',
    '[class]': 'templateData().icon',
  },
})
export class IconComponent<T, ExtraProps extends { icon?: string }> {
  templateData = input.required<ControlTemplateData<T> & ExtraProps>();
}
