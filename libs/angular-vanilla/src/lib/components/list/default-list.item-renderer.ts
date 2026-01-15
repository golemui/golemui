import { Component, Input } from '@angular/core';
import { ItemRenderContext } from '@golemui/core';

@Component({
  selector: 'gui-default-list-item-renderer',
  standalone: true,
  template: `<div
    class="gui-list__item"
    [class.disabled]="disabled"
    [class.gui-list__item-selected]="selected"
  >
    {{ template }}
  </div>`,
  host: {
    class: 'gui-default-list-item-renderer',
  },
})
export class DefaultListItemRenderer implements ItemRenderContext<string> {
  @Input({ required: true }) template!: string;
  @Input({ required: true }) value!: string | number;
  @Input({ required: true }) index!: number;
  @Input() selected?: boolean;
  @Input() disabled?: boolean;
}
