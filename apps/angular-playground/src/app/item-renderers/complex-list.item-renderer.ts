import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ItemRenderContext } from '@golemui/core';

type ComplexItem = {
  title: string;
  description: string;
};

@Component({
  selector: 'app-complex-list-item-renderer',
  standalone: true,
  styles: `
    .disabled {
      color: gray;
    }
    .selected {
      font-weight: bold;
    }
  `,
  template: `<div [id]="value" [class.disabled]="disabled" [class.selected]="selected">
    <h2>{{ item.title }}</h2>
    <p>{{ item.description }}</p>
  </div> `,
})
export class ComplexListItemRenderer implements ItemRenderContext<ComplexItem>, OnChanges {
  @Input({ required: true }) item!: ComplexItem;
  @Input({ required: true }) value!: string | number;
  @Input({ required: true }) index!: number;
  @Input() selected?: boolean;
  @Input() disabled?: boolean;

  ngOnChanges(changes: SimpleChanges): void {
    console.log(changes);
  }
}
