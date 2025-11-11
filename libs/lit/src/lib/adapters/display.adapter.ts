import { createContext } from '@lit/context';
import * as Core from '@golemui/core';
import { BaseAdapter } from './base.adapter';

export const displayFieldContext = createContext<DisplayFieldAdapter<any>>('ffDisplayFieldAdapter');

export class DisplayFieldAdapter<
  ExtraProps extends Record<string, any>,
> extends BaseAdapter<Core.DisplayField> {
  override templateData = {} as ExtraProps;

  init(field: Core.DisplayField) {
    this.field = field;

    // Set initial templateData
    this.setTemplateData({
      ...this.field.props,
    });

    this.addFieldToTheStore(field);
    this.propsUpdaterByCurrentState(this.templateData);
  }
}
