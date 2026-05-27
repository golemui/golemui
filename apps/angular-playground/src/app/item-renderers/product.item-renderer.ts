import { Component, input } from '@angular/core';
import { type AngularItemRenderContext } from '@golemui/angular';

type ProductItem = {
  product: string;
  description: string;
  price: number;
};

@Component({
  selector: 'app-product-item-renderer',
  standalone: true,
  styles: `
    h2,
    p {
      margin: 0;
      padding: 0;
    }

    .product-renderer {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
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
    <div>
      <h2>{{ template().product }}</h2>
      <p>{{ template().description }}</p>
    </div>
    <div>
      <p>{{ template().price }}</p>
    </div>
  </div>`,
})
export class ProductItemRenderer implements AngularItemRenderContext<ProductItem> {
  template = input.required<ProductItem>();
  value = input.required<string | number>();
  index = input.required<number>();
  selected = input<boolean | undefined>(undefined);
  disabled = input<boolean | undefined>(undefined);
  focused = input<boolean | undefined>(undefined);
}
