import { inject, Injectable, signal } from '@angular/core';
import * as Core from '@formforge/core';
import { Subject, takeUntil } from 'rxjs';
import { AngularFormContext } from '../context/form.context';

@Injectable()
export class ButtonAdapter {
  private context = inject(AngularFormContext);
  private destroy$ = new Subject<void>();
  private field!: Core.ButtonField;

  templateData = signal<{ label?: string; disabled?: boolean }>({});

  init(field: Core.ButtonField) {
    this.field = field;
    this.templateData.update((value) => ({
      ...value,
      label: this.field.label,
    }));

    this.context.store.dispatch({
      type: 'ADD_FIELD',
      payload: { field },
    });

    this.context.store.state$
      .pipe(takeUntil(this.destroy$), Core.fieldFlagsByUid$(field.uid))
      .subscribe((fieldFlags) => {
        this.templateData.update((value) => ({
          ...value,
          disabled: fieldFlags?.disabled ?? (field.disabled as boolean),
        }));
      });

    this.context.store.state$
      .pipe(takeUntil(this.destroy$), Core.currentStates)
      .subscribe(() => {
        this.templateData.update((value) => ({
          ...value,
          label: this.context.getPropertyValueByCurrentState(
            'label',
            this.field,
          ),
        }));
      });

    this.context.emitEvent('load', this.field);
  }

  click() {
    this.context.emitEvent('click', this.field);
  }

  destroy() {
    this.context.store.dispatch({
      type: 'REMOVE_FIELD',
      payload: { uid: this.field.uid },
    });
    this.destroy$.next();
  }
}
