import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as Core from '@golemui/core';

@Component({
  standalone: true,
  selector: '[gui-icon]',
  imports: [CommonModule],
  template: ``,
  host: {
    class: 'gui-widget-icon',
    '[class.gui-widget-icon--right]': 'templateData().iconPosition === "right"',
    '[class]': 'templateData().icon',
  },
})
export class IconComponent<T, ExtraProps extends { icon?: string; iconPosition?: string }> {
  templateData = input.required<Core.ControlTemplateData<T> & ExtraProps>();
}
