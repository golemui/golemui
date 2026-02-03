import { inject, WritableSignal } from '@angular/core';
import * as Core from '@golemui/core';
import { Subject, takeUntil } from 'rxjs';
import { AngularFormContext } from '../context/form.context';

export abstract class BaseFieldAdapter<F extends Core.NonFunctionWidget> {
  protected context = inject(AngularFormContext);
  protected destroy$ = new Subject<void>();
  protected field!: F;

  protected addFieldToTheStore(field: F) {
    this.context.store.dispatch({
      type: 'ADD_WIDGET',
      payload: { widget: field },
    });
  }

  // TODO: we may want to not flatten everything to avoid name collisions
  // Listen to the calculated props stream and keep all field props merged in a flattened object
  protected templateDataUpdater<TemplateData extends Record<string, any>>(
    templateData: WritableSignal<TemplateData>,
  ) {
    this.context.store.state$
      .pipe(takeUntil(this.destroy$), Core.calculatedWidgetsByUid$(this.field.uid))
      .subscribe((calculatedField) => {
        templateData.update((current) => {
          return {
            ...current,
            ...calculatedField,
            ...calculatedField.props,
            lang: this.context.store.getState().lang,
          };
        });
      });
  }

  destroy() {
    this.context.store.dispatch({
      type: 'REMOVE_WIDGET',
      payload: { uid: this.field.uid },
    });
    this.destroy$.next();
  }
}
