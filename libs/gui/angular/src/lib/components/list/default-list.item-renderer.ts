import { Component, input } from '@angular/core';
import { type AngularItemRenderContext } from '@golemui/angular';

@Component({
  selector: 'gui-default-list-item-renderer',
  standalone: true,
  template: `<div
    class="gui-list__item"
    [class.gui-list__item-disabled]="disabled()"
    [class.gui-list__item-selected]="selected()"
    [class.gui-list__item-focused]="focused()"
  >
    {{ template() }}
  </div>`,
  host: {
    class: 'gui-default-list-item-renderer',
  },
})
export class DefaultListItemRenderer implements AngularItemRenderContext<string> {
  template = input.required<string>();
  value = input.required<string | number>();
  index = input.required<number>();
  selected = input<boolean | undefined>(undefined);
  disabled = input<boolean | undefined>(undefined);
  focused = input<boolean | undefined>(undefined);
}
