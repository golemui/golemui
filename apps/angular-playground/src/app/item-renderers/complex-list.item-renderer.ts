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
      display: flex;
      flex-direction: column;
      justify-content: space-around;
      padding: 0 12px;
      cursor: pointer;
      height: 100%;
    }

    .odd {
      background-color: dimgray;
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
    role="option"
    class="my-custom-class"
    [class.disabled]="disabled"
    [class.selected]="selected"
    [class.focused]="focused"
    [class.odd]="index % 2"
    [attr.aria-selected]="selected"
    [attr.aria-disabled]="disabled"
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
