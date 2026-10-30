import { Component, input } from '@angular/core';
import { type AngularItemRenderContext } from '@golemui/angular';

/** Shows every field of the render context, so a test can read what the widget passed. */
@Component({
  standalone: true,
  selector: 'gui-custom-item-renderer',
  template: `<div data-cy="custom-item">
    {{ index() }}|{{ value() }}|{{ template().name }}|{{ selected() === true }}
  </div>`,
})
export class CustomItemRendererComponent implements AngularItemRenderContext<{ name: string }> {
  template = input.required<{ name: string }>();
  value = input.required<string | number>();
  index = input.required<number>();
  selected = input<boolean | undefined>(undefined);
  disabled = input<boolean | undefined>(undefined);
  focused = input<boolean | undefined>(undefined);
}
