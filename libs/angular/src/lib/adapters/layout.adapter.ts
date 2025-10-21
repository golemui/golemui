import { Injectable, signal } from '@angular/core';
import * as Core from '@formforge/core';
import { combineLatest, map, of, takeUntil } from 'rxjs';
import { BaseAdapter } from './base.adapter';

type TemplateData = {
  children: Core.FormField<string>[];
};

@Injectable()
export class LayoutAdapter<
  ExtraProps extends Record<string, any>,
> extends BaseAdapter<Core.LayoutField> {
  templateData = signal<TemplateData & ExtraProps>({
    children: [] as Core.FormField<string>[],
  } as TemplateData & ExtraProps);

  init(field: Core.LayoutField) {
    this.field = field;

    // Set initial templateData
    this.templateData.update((current) => ({
      ...current,
      ...this.field.props,
    }));

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
        this.templateData.update((current) => ({
          ...current,
          children,
        }));
      });

    this.addFieldToTheStore(field);
    this.propsUpdaterByCurrentState(this.templateData);
  }
}
