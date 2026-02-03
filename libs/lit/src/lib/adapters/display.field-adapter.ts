import * as Core from '@golemui/core';
import { createContext } from '@lit/context';
import { BaseFieldAdapter } from './base.field-adapter';

export const displayFieldContext =
  createContext<DisplayFieldAdapter<any>>('guiDisplayFieldAdapter');

export class DisplayFieldAdapter<
  ExtraProps extends Record<string, any>,
> extends BaseFieldAdapter<Core.DisplayWidget> {
  override templateData = {} as Core.DisplayWidgetTemplateData & ExtraProps;

  init(field: Core.DisplayWidget) {
    this.field = field;

    // Set initial templateData
    this.setTemplateData({
      ...this.field.props,
    });

    this.addFieldToTheStore(field);
    this.templateDataUpdater();
  }
}
