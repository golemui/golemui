import { inject, WritableSignal } from '@angular/core';
import * as Core from '@golemui/core';
import { Subject, takeUntil } from 'rxjs';
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
  protected propsUpdater<ExtraProps extends Record<string, any>>(
    templateData: WritableSignal<ExtraProps>,
    postUpdate: (obj: ExtraProps) => ExtraProps = (obj) => obj,
  ) {
    this.context.store.state$
      .pipe(takeUntil(this.destroy$), Core.calculatedFieldsByUid$(this.field.uid))
      .subscribe((calculatedField) => {
        // TODO: refine this
        templateData.update((current) => {
          return postUpdate({
            ...current,
            ...calculatedField,
            ...calculatedField.props,
            ...(calculatedField as Core.InteractiveField).on,
          });
        });
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
