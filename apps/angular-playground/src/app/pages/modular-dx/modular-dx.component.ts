import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { modularDx, onFormEvent } from '@golemui/apps-shared';
import type { FormEvent, FormHealth, FormSubmitEvent } from '@golemui/core';
import { FormComponent } from '@golemui/gui-angular';
import type { Dependencies, GuiFormInitConfig } from '@golemui/gui-shared';
import snarkdown from 'snarkdown';

const formExample = modularDx;

const dependencies: Dependencies = {
  markdown: { parse: (markdown: string) => snarkdown(markdown) },
};

@Component({
  imports: [CommonModule, FormComponent],
  selector: 'app-modular-dx-page',
  templateUrl: './modular-dx.component.html',
})
export class ModularDxPage {
  protected config: GuiFormInitConfig = {
    formDef: formExample.formDef,
    data: formExample.data,
    formSelectors: formExample.formSelectors,
    formConfig: formExample.formConfig,
    dependencies,
  };
  protected error = '';

  protected onFormEvent(event: FormEvent) {
    onFormEvent(event);
  }

  protected onFormHealth(formHealth: FormHealth) {
    if (formHealth.status === 'errored') {
      this.error = formHealth.message;
    }
  }

  protected onFormSubmit(event: FormSubmitEvent) {
    console.log('👉 onFormSubmit', event.data);
  }
}
