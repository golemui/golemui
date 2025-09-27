import { inject, Injectable, signal } from '@angular/core';
import * as Core from '@formforge/core';
import { Subject, takeUntil } from 'rxjs';
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

    this.context.store.state$
      .pipe(takeUntil(this.destroy$), Core.currentStates)
      .subscribe(() => {
        const props = this.field.props;
        if (props !== undefined) {
          // we dont want 'label.register', we only want the base keys 'label' (even if they are not set)
          const uniquePropsWithoutState = Array.from(
            new Set(
              Object.keys(props).map((prop) => prop.split('.')[0]),
            ).keys(),
          );
          const updatedProps = uniquePropsWithoutState.reduce(
            (templateData, key: keyof ExtraProps) => {
              templateData[key] = this.context.getPropertyValueByCurrentState(
                key as string,
                props,
              ) as any;
              return templateData;
            },
            {} as ExtraProps,
          );

          this.templateData.update((value) => ({
            ...value,
            ...updatedProps,
          }));
        }
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
