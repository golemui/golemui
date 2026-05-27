import { Component, input } from '@angular/core';
import { type AngularItemRenderContext } from '@golemui/angular';

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
    [class.disabled]="disabled()"
    [class.selected]="selected()"
    [class.focused]="focused()"
    [class.odd]="index() % 2"
  >
    <h2>{{ template().title }}</h2>
    <p>{{ template().description }}</p>
  </div>`,
})
export class ComplexListItemRenderer implements AngularItemRenderContext<ComplexItem> {
  template = input.required<ComplexItem>();
  value = input.required<string | number>();
  index = input.required<number>();
  selected = input<boolean | undefined>(undefined);
  disabled = input<boolean | undefined>(undefined);
  focused = input<boolean | undefined>(undefined);
}
