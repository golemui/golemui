import { Component, Input } from '@angular/core';
import { ItemRenderContext } from '@golemui/core';

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
    [class.disabled]="disabled"
    [class.selected]="selected"
    [class.focused]="focused"
    [class.odd]="index % 2"
  >
    <div>
      <h2>{{ template.product }}</h2>
      <p>{{ template.description }}</p>
    </div>
    <div>
      <p>{{ template.price }}</p>
    </div>
  </div>`,
})
export class ProductItemRenderer implements ItemRenderContext<ProductItem> {
  @Input({ required: true }) template!: ProductItem;
  @Input({ required: true }) value!: string | number;
  @Input({ required: true }) index!: number;
  @Input() selected?: boolean;
  @Input() disabled?: boolean;
  @Input() focused?: boolean;
}
