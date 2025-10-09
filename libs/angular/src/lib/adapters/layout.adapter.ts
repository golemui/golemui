import { Injectable } from '@angular/core';
import * as Core from '@formforge/core';
import { combineLatest, map, of, takeUntil } from 'rxjs';
import { BaseAdapter } from './base.adapter';

@Injectable()
export class LayoutAdapter extends BaseAdapter<Core.LayoutField> {
  children$ = of<Core.FormField<string>[]>([]);

  init(field: Core.LayoutField) {
    this.field = field;

    const fieldFlagsSelector = this.context.store.state$.pipe(
      Core.selectFieldFlags,
    );

    // Listen to the fieldFlags stream and filter the layout's `children` based on their `hidden` flag
    this.children$ = combineLatest([
      of(field.children),
      fieldFlagsSelector,
    ]).pipe(
      takeUntil(this.destroy$),
      map(([children]) => {
        const fieldFlags = this.context.store.getState().fieldFlags;
        return children.filter(
          (child) =>
            fieldFlags[child.uid] === undefined ||
            !fieldFlags[child.uid].hidden,
        );
      }),
    );

    this.addFieldToTheStore(field);
  }
}
