import { Injectable, signal } from '@angular/core';
import * as Core from '@formforge/core';
import { BaseAdapter } from './base.adapter';

@Injectable()
export class DisplayFieldAdapter<
  ExtraProps extends Record<string, any>,
> extends BaseAdapter<Core.DisplayField> {
  templateData = signal<ExtraProps>({} as ExtraProps);

  init(field: Core.DisplayField) {
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
