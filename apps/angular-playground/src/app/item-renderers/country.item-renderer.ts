import { Component, Input } from '@angular/core';
import { ItemRenderContext } from '@golemui/core';

type CountryItem = {
  id: string;
  label: string;
  flag: string;
};

@Component({
  selector: 'app-country-item-renderer',
  standalone: true,
  styles: `
    h2,
    p {
      margin: 0;
      padding: 0;
    }

    .country-renderer {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      padding: 0 12px;
      cursor: pointer;
      height: 100%;
    }

    .odd {
      background-color: #2c303c;
    }
    .selected {
      color: var(--gui-color-bg);
      background-color: var(--gui-color-fg);
      font-weight: bold;
    }
    .focused {
      box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--gui-color-fg) 25%, transparent);
    }
  `,
  template: `<div
    class="country-renderer"
    [class.selected]="selected"
    [class.focused]="focused"
    [class.odd]="index % 2"
  >
    <span>{{ template.label }}</span>
    <span>{{ template.flag }}</span>
  </div>`,
})
export class CountryItemRenderer implements ItemRenderContext<CountryItem> {
  @Input({ required: true }) template!: CountryItem;
  @Input({ required: true }) value!: string | number;
  @Input({ required: true }) index!: number;
  @Input() selected?: boolean;
  @Input() disabled?: boolean;
  @Input() focused?: boolean;
}
