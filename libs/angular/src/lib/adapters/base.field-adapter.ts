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

  // TODO: we may want to not flatten everything to avoid name collisions
  // Listen to the calculated props stream and keep all field props merged in a flattened object
  protected templateDataUpdater<TemplateData extends Record<string, any>>(
    templateData: WritableSignal<TemplateData>,
    postUpdate: (obj: TemplateData) => TemplateData = (obj) => obj,
  ) {
    this.context.store.state$
      .pipe(takeUntil(this.destroy$), Core.calculatedFieldsByUid$(this.field.uid))
      .subscribe((calculatedField) => {
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
