import { afterNextRender, Component, signal } from '@angular/core';
import type { FormSubmitEvent } from '@golemui/core';
import { FormComponent } from '@golemui/gui-angular';
import { config } from './form-config';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [FormComponent],
  template: `
    <div class="harness">
      <h1 class="harness__title">Angular server rendering harness</h1>
      <p class="harness__status" [attr.data-hydrated]="hydrated()">
        {{ hydrated() ? 'Hydrated on the client' : 'Server HTML, not yet hydrated' }}
      </p>
      <p class="harness__note">
        Angular renders the form structure on the server and hydrates it in place. The widget
        internals come from the custom elements, which stay inert until hydration removes their
        defer-hydration attribute. View source to see the server output.
      </p>
      <gui-form [config]="config" (formSubmit)="onSubmit($event)" />
    </div>
  `,
})
export class AppComponent {
  protected config = config;
  // Starts false so the first client render matches the server markup. afterNextRender
  // never runs on the server, so only a hydrated page sets it to true.
  protected hydrated = signal(false);

  constructor() {
    afterNextRender(() => this.hydrated.set(true));
  }

  protected onSubmit(event: FormSubmitEvent) {
    console.log('form submitted', event);
  }
}
