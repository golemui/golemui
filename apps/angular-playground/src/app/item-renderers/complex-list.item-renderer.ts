import { Component, Input } from '@angular/core';
import { ItemRenderContext } from '@golemui/core';

type ComplexItem = {
  title: string;
  description: string;
};

@Component({
  selector: 'app-complex-list-item-renderer',
  standalone: true,
  styles: `
    h2,
    p {
      margin: 0;
      padding: 0;
    }

    .my-custom-class {
      padding: 0 12px;
      cursor: pointer;
    }

    .disabled {
      color: gray;
    }
    .selected {
      color: black;
      background-color: lightgray;
      font-weight: bold;
    }
  `,
  template: `<div class="my-custom-class" [class.disabled]="disabled" [class.selected]="selected">
    <h2>{{ template.title }}</h2>
    <p>{{ template.description }}</p>
  </div>`,
})
export class ComplexListItemRenderer implements ItemRenderContext<ComplexItem> {
  @Input({ required: true }) template!: ComplexItem;
  @Input({ required: true }) value!: string | number;
  @Input({ required: true }) index!: number;
  @Input() selected?: boolean;
  @Input() disabled?: boolean;
}
