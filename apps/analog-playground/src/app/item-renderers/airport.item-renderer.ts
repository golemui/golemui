import { Component, input } from '@angular/core';
import { type AngularItemRenderContext } from '@golemui/angular';
import { type AirportItem } from '@golemui/apps-shared';

@Component({
  selector: 'app-airport-item-renderer',
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
    class="airport-renderer"
    [class.disabled]="disabled()"
    [class.selected]="selected()"
    [class.focused]="focused()"
    [class.odd]="index() % 2"
  >
    <div>
      <p>{{ template().name }}</p>
    </div>
    <div>
      <h2>{{ template().iata }}</h2>
    </div>
  </div>`,
})
export class AirportItemRenderer implements AngularItemRenderContext<AirportItem> {
  template = input.required<AirportItem>();
  value = input.required<string | number>();
  index = input.required<number>();
  selected = input<boolean | undefined>(undefined);
  disabled = input<boolean | undefined>(undefined);
  focused = input<boolean | undefined>(undefined);
}
