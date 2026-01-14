import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ItemRenderContext } from '@golemui/core';

@Component({
  selector: 'gui-default-list-item-renderer',
  standalone: true,
  styles: `
    .disabled {
      color: gray;
    }
    .selected {
      font-weight: bold;
    }
  `,
  template: `<span [id]="value" [class.disabled]="disabled" [class.selected]="selected">{{
    item
  }}</span> `,
})
export class DefaultListItemRenderer implements ItemRenderContext<string>, OnChanges {
  @Input({ required: true }) item!: string;
  @Input({ required: true }) value!: string | number;
  @Input({ required: true }) index!: number;
  @Input() selected?: boolean;
  @Input() disabled?: boolean;

  ngOnChanges(changes: SimpleChanges): void {
    console.log(changes);
  }
}
