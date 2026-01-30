import { Component, Input } from '@angular/core';
import { ItemRenderContext } from '@golemui/core';
import { AirportItem } from '@golemui/apps-shared';

@Component({
  selector: 'app-airport-item-renderer',
  standalone: true,
  styles: `
    h2,
    p {
      margin: 0;
      padding: 0;
    }

    .airport-renderer {
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
    role="option"
    class="airport-renderer"
    [class.disabled]="disabled"
    [class.selected]="selected"
    [class.focused]="focused"
    [class.odd]="index % 2"
    [attr.aria-selected]="selected"
    [attr.aria-disabled]="disabled"
  >
    <div>
      <p>{{ template.name }}</p>
    </div>
    <div>
      <h2>{{ template.iata }}</h2>
    </div>
  </div>`,
})
export class AirportItemRenderer implements ItemRenderContext<AirportItem> {
  @Input({ required: true }) template!: AirportItem;
  @Input({ required: true }) value!: string | number;
  @Input({ required: true }) index!: number;
  @Input() selected?: boolean;
  @Input() disabled?: boolean;
  @Input() focused?: boolean;
}
