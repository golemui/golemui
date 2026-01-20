import { Component, Input } from '@angular/core';
import { ItemRenderContext } from '@golemui/core';

@Component({
  selector: 'gui-default-list-item-renderer',
  standalone: true,
  template: `<div
    role="option"
    class="gui-list__item"
    [class.gui-list__item-disabled]="disabled"
    [class.gui-list__item-selected]="selected"
    [class.gui-list__item-focused]="focused"
    [attr.aria-selected]="selected"
    [attr.aria-disabled]="disabled"
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
  @Input() focused?: boolean;
}
