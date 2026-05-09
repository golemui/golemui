import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import * as AppsShared from '@golemui/apps-shared';
import * as Core from '@golemui/core';
import * as GuiAngular from '@golemui/gui-angular';

const md = AppsShared.modularDx;

@Component({
  imports: [CommonModule, GuiAngular.FormComponent],
  selector: 'app-modular-dx-page',
  templateUrl: './modular-dx.component.html',
})
export class ModularDxPage {
  protected formDef = md.formDef;
  protected formData = md.data;
  protected formSelectors = md.formSelectors;
  protected formConfig = md.formConfig;

  protected async onFormEvent(event: Core.FormEvent) {
    await AppsShared.onFormEvent(event);
  }
}
