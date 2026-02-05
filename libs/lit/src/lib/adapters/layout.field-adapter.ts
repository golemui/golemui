import * as Core from '@golemui/core';
import { createContext } from '@lit/context';
import { takeUntil } from 'rxjs';
import { BaseFieldAdapter } from './base.field-adapter';

export const layoutContext = createContext<LayoutFieldAdapter<any>>('guiLayoutFieldAdapter');

export class LayoutFieldAdapter<
  ExtraProps extends Record<string, any>,
> extends BaseFieldAdapter<Core.LayoutWidget> {
  override templateData = {} as Core.LayoutTemplateData & ExtraProps;

  init(field: Core.LayoutWidget) {
    this.field = field;

    // Set initial templateData
    this.setTemplateData({
      ...this.field.props,
    });

    // Listen to the layout's `hidden`-flag-filtered children stream
    this.context.store.state$
      .pipe(Core.calculatedLayoutChildrenByUid$(this.field.uid))
      .pipe(takeUntil(this.destroy$))
      .subscribe((children) => {
        this.setTemplateData({
          children,
        });
      });

    this.addFieldToTheStore(field);
    this.templateDataUpdater();
  }

  change<T>(detail?: T) {
    this.context.emitEvent('change', this.field, detail);
  }
}
