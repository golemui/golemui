import { createContext } from '@lit/context';
import * as Core from '@formforge/core';
import { BaseAdapter } from './base.adapter';

export const fieldContext = createContext<FieldAdapter<any>>('ffFieldAdapter');

export class FieldAdapter<ExtraProps extends Record<string, any>> extends BaseAdapter<Core.Field> {
  override templateData = {} as ExtraProps;

  init(field: Core.Field) {
    this.field = field;

    // Set initial templateData
    this.setTemplateData({
      ...this.field.props,
    });

    this.addFieldToTheStore(field);
    this.propsUpdaterByCurrentState(this.templateData);
  }
}
