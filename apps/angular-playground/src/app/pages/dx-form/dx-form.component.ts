import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import * as AppsShared from '@golemui/apps-shared';
import * as GuiAngular from '@golemui/gui-angular';
import snarkdown from 'snarkdown';

const ks = AppsShared.buildKitchenSinkDx({
  widgetLoaders: {
    heading: async () =>
      (await import('../../custom-widgets/heading/heading.component')).HeadingComponent,
  },
  dependencies: {
    markdown: {
      parse: (md: string) => snarkdown(md),
    },
  },
});

@Component({
  imports: [CommonModule, GuiAngular.FormComponent],
  selector: 'app-dx-form-page',
  templateUrl: './dx-form.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DxFormPage {
  protected formDef = ks.formDef;
  protected formData = ks.data;
  protected formSelectors = ks.formSelectors;
  protected formConfig = ks.formConfig;
}
