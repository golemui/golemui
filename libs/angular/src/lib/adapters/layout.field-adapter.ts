import { Injectable, signal } from '@angular/core';
import * as Core from '@golemui/core';
import { takeUntil } from 'rxjs';
import { BaseFieldAdapter } from './base.field-adapter';

@Injectable()
export class LayoutFieldAdapter<
  ExtraProps extends Record<string, any>,
> extends BaseFieldAdapter<Core.LayoutWidget> {
  templateData = signal<Core.LayoutTemplateData & ExtraProps>({
    children: [] as Core.FormWidget<string>[],
  } as Core.LayoutTemplateData & ExtraProps);

  init(field: Core.LayoutWidget) {
    this.field = field;

    // Set initial templateData
    this.templateData.update((current) => ({
      ...current,
      ...this.field.props,
    }));

    // Listen to the layout's `hidden`-flag-filtered children stream
    this.context.store.state$
      .pipe(Core.calculatedLayoutChildrenByUid$(this.field.uid))
      .pipe(takeUntil(this.destroy$))
      .subscribe((children) => {
        this.templateData.update((current) => ({
          ...current,
          children,
        }));
      });

    this.addFieldToTheStore(field);
    this.templateDataUpdater(this.templateData);
  }

  change<T>(detail?: T) {
    this.context.emitEvent('change', this.field, detail);
  }
}
