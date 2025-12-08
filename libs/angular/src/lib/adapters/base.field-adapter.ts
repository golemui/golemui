import { inject, WritableSignal } from '@angular/core';
import * as Core from '@golemui/core';
import { Subject } from 'rxjs';
import { AngularFormContext } from '../context/form.context';

export abstract class BaseFieldAdapter<F extends Core.FormField> {
  protected context = inject(AngularFormContext);
  protected destroy$ = new Subject<void>();
  protected field!: F;

  protected addFieldToTheStore(field: F) {
    this.context.store.dispatch({
      type: 'ADD_FIELD',
      payload: { field },
    });
  }

  // Listen to the form states stream and keep all `props` in sync with the current state
  protected propsUpdaterByCurrentState<ExtraProps extends Record<string, any>>(
    templateData: WritableSignal<ExtraProps>,
  ) {
    Core.propsUpdaterByCurrentState({
      field: this.field,
      context: this.context,
      updaterFn: (updatedProps) => {
        templateData.update((current) => ({
          ...current,
          ...updatedProps,
        }));
      },
      destroy$: this.destroy$,
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
