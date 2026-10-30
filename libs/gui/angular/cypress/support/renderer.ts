import { Component, input } from '@angular/core';
import { type RenderTextFn } from '@golemui/ui-testing';

@Component({
  standalone: true,
  selector: 'gui-test-renderer-text',
  template: '<span class="renderer-text">{{ api() }}</span>',
})
class RendererTextComponent {
  api = input<string>();
}

/** Builds the `{ component, api }` value the Angular renderer display creates: a span with the class `renderer-text`. */
export const renderText: RenderTextFn = (text) => ({
  component: RendererTextComponent,
  api: text,
});
