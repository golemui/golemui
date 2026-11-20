import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { mockMarkdownParser, mockUploadService, onFormEvent, signup } from '@golemui/apps-shared';
import type { FormEvent, FormHealth, FormSubmitEvent } from '@golemui/core';
import { FormComponent } from '@golemui/gui-angular';
import type { Dependencies, GuiFormInitConfig } from '@golemui/gui-shared';

const dependencies: Dependencies = {
  markdown: mockMarkdownParser,
  uploadService: mockUploadService,
};

@Component({
  imports: [CommonModule, FormComponent],
  selector: 'app-signup-page',
  templateUrl: './signup.component.html',
})
export class SignupPage {
  protected config: GuiFormInitConfig = {
    formDef: signup.form,
    data: signup.data,
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
