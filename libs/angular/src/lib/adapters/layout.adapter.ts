import { inject, Injectable, signal } from '@angular/core';
import * as Core from '@formforge/core';
import { Subject, takeUntil } from 'rxjs';
import { AngularFormContext } from '../context/form.context';

@Injectable()
export class LayoutAdapter {
  private context = inject(AngularFormContext);
  private destroy$ = new Subject<void>();
  private field!: Core.LayoutField;

  templateData = signal<{
    hidden: boolean;
    children: Core.FormField<string>[];
  }>({
    hidden: false,
    children: [],
  });

  init(field: Core.LayoutField) {
    this.field = field;

    this.context.store.dispatch({
      type: 'ADD_FIELD',
      payload: { field },
    });

    Core.calculatedForm(this.context.store.state$)
      .pipe(takeUntil(this.destroy$))
      .subscribe((layout) =>
        this.templateData.update((value) => ({
          ...value,
          children: layout.children,
        })),
      );
  }

  destroy() {
    this.context.store.dispatch({
      type: 'REMOVE_FIELD',
      payload: { uid: this.field.uid },
    });
    this.destroy$.next();
  }
}
