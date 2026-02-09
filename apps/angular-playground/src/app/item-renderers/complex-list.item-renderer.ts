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

    .product-renderer {
      display: flex;
      flex-direction: column;
      justify-content: space-around;
      padding: 0 12px;
      cursor: pointer;
      height: 100%;
    }

    .odd {
      background-color: #3b3e47;
    }
    .disabled {
      color: gray;
    }
    .selected {
      color: black;
      background-color: lightgray;
      font-weight: bold;
    }
    .focused {
      border: 2px solid black;
    }
  `,
  template: `<div
    class="product-renderer"
    [class.disabled]="disabled"
    [class.selected]="selected"
    [class.focused]="focused"
    [class.odd]="index % 2"
  >
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
  @Input() focused?: boolean;
}
