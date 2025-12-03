import * as Core from '@golemui/core';
import { createContext } from '@lit/context';
import { combineLatest, map, of, takeUntil } from 'rxjs';
import { BaseFieldAdapter } from './base.field-adapter';

export const layoutContext = createContext<LayoutFieldAdapter<any>>('guiLayoutFieldAdapter');

export class LayoutFieldAdapter<
  ExtraProps extends Record<string, any>,
> extends BaseFieldAdapter<Core.LayoutField> {
  override templateData = {} as Core.LayoutTemplateData & ExtraProps;

  init(field: Core.LayoutField) {
    this.field = field;

    // Set initial templateData
    this.setTemplateData({
      ...this.field.props,
    });

    const fieldFlagsSelector = this.context.store.state$.pipe(Core.selectFieldFlags);

    // Listen to the fieldFlags stream and filter the layout's `children` based on their `hidden` flag
    combineLatest([of(field.children), fieldFlagsSelector])
      .pipe(
        takeUntil(this.destroy$),
        map(([children]) => {
          const fieldFlags = this.context.store.getState().fieldFlags;
          return children.filter(
            (child) => fieldFlags[child.uid] === undefined || !fieldFlags[child.uid].hidden,
          );
        }),
      )
      .subscribe((children) => {
        this.setTemplateData({
          children,
        });
      });

    this.addFieldToTheStore(field);
    this.propsUpdaterByCurrentState(this.templateData);
  }
}
