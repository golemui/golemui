import { Injectable, signal } from '@angular/core';
import * as Core from '@formforge/core';
import { BaseAdapter } from './base.adapter';

@Injectable()
export class FieldAdapter<ExtraProps extends Record<string, any>> extends BaseAdapter<Core.Field> {
  templateData = signal<ExtraProps>({} as ExtraProps);

  init(field: Core.Field) {
    this.field = field;

    // Set initial templateData
    this.templateData.update((current) => ({
      ...current,
      ...this.field.props,
    }));

    this.addFieldToTheStore(field);
    this.propsUpdaterByCurrentState(this.templateData);
  }
}
