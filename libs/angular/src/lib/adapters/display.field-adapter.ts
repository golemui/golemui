import { Injectable, signal } from '@angular/core';
import * as Core from '@golemui/core';
import { BaseFieldAdapter } from './base.field-adapter';

@Injectable()
export class DisplayFieldAdapter<
  ExtraProps extends Record<string, any>,
> extends BaseFieldAdapter<Core.DisplayField> {
  templateData = signal<Core.DisplayFieldTemplateData & ExtraProps>(
    {} as Core.DisplayFieldTemplateData & ExtraProps,
  );

  init(field: Core.DisplayField) {
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
