import { Component, input } from '@angular/core';
import { type AngularItemRenderContext } from '@golemui/angular';

@Component({
  selector: 'gui-default-multi-list-item-renderer',
  standalone: true,
  template: `<div
    class="gui-list__item"
    [class.gui-list__item-disabled]="disabled()"
    [class.gui-list__item-selected]="selected()"
    [class.gui-list__item-focused]="focused()"
  >
    <span class="gui-list__item-check" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 256 256">
        <path
          d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"
        ></path>
      </svg>
    </span>
    {{ template() }}
  </div>`,
  host: {
    class: 'gui-default-list-item-renderer',
  },
})
export class DefaultMultiListItemRenderer implements AngularItemRenderContext<string> {
  template = input.required<string>();
  value = input.required<string | number>();
  index = input.required<number>();
  selected = input<boolean | undefined>(undefined);
  disabled = input<boolean | undefined>(undefined);
  focused = input<boolean | undefined>(undefined);
}
