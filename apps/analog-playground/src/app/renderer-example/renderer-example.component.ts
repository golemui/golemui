import { Component, input } from '@angular/core';
import type { WidgetPropertyFunctionParams } from '@golemui/core';

/**
 * Tiny Angular component used as the `render.component` for the Renderer
 * widget's kitchen-sink example. Receives the resolved form API as an input
 * and displays the live `clientName` value.
 */
@Component({
  selector: 'app-renderer-example',
  template: `<h1>Client name: {{ api().$form?.rendererClientName || 'unknown' }}</h1>`,
})
export class RendererExampleComponent {
  api = input.required<WidgetPropertyFunctionParams<any>>();
}
