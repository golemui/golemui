import { inject, Injectable, signal } from '@angular/core';
import * as Core from '@formforge/core';
import { Subject } from 'rxjs';
import { FormContext } from '../context/form.context';

@Injectable()
export class FieldAdapter<ExtraProps extends Record<string, any>> {
  private context = inject(FormContext);
  private destroy$ = new Subject<void>();
  private field!: Core.Field;

  templateData = signal<ExtraProps>({} as ExtraProps);

  init(field: Core.Field) {
    this.field = field;

    this.templateData.update((value) => ({
      ...value,
      ...this.field.props,
    }));

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
