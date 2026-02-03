import { Injectable, signal } from '@angular/core';
import * as Core from '@golemui/core';
import { BaseFieldAdapter } from './base.field-adapter';

@Injectable()
export class DisplayFieldAdapter<
  ExtraProps extends Record<string, any>,
> extends BaseFieldAdapter<Core.DisplayWidget> {
  templateData = signal<Core.DisplayWidgetTemplateData & ExtraProps>(
    {} as Core.DisplayWidgetTemplateData & ExtraProps,
  );

  init(field: Core.DisplayWidget) {
    this.field = field;

    // Set initial templateData
    this.templateData.update((current) => ({
      ...current,
      ...this.field.props,
    }));

    this.addFieldToTheStore(field);
    this.templateDataUpdater(this.templateData);
  }
}
