import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import * as AppsShared from '@golemui/apps-shared';
import * as Core from '@golemui/core';
import * as GuiAngular from '@golemui/gui-angular';
import type { GuiFormInitConfig } from '@golemui/gui-shared';

const md = AppsShared.modularDx;

@Component({
  imports: [CommonModule, GuiAngular.FormComponent],
  selector: 'app-modular-dx-page',
  templateUrl: './modular-dx.component.html',
})
export class ModularDxPage {
  protected config: GuiFormInitConfig = {
    formDef: md.formDef,
    data: md.data,
    formSelectors: md.formSelectors,
    formConfig: md.formConfig,
  };

  protected async onFormEvent(event: Core.FormEvent) {
    await AppsShared.onFormEvent(event);
  }
}
