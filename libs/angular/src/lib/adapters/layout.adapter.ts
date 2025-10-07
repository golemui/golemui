import { inject, Injectable } from '@angular/core';
import * as Core from '@formforge/core';
import { combineLatest, map, Observable, of, Subject, takeUntil } from 'rxjs';
import { AngularFormContext } from '../context/form.context';

@Injectable()
export class LayoutAdapter {
  private context = inject(AngularFormContext);
  private destroy$ = new Subject<void>();
  private field!: Core.LayoutField;
  children$ = of<Core.FormField<string>[]>([]);

  init(field: Core.LayoutField) {
    this.field = field;
    const children: Observable<Core.FormField<string>[]> = of(field.children);
    const selectFieldFlags = this.context.store.state$.pipe(
      Core.selectFieldFlags,
    );

    this.children$ = combineLatest([children, selectFieldFlags]).pipe(
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

    this.context.store.dispatch({
      type: 'ADD_FIELD',
      payload: { field },
    });
  }

  destroy() {
    this.context.store.dispatch({
      type: 'REMOVE_FIELD',
      payload: { uid: this.field.uid },
    });
    this.destroy$.next();
  }
}
