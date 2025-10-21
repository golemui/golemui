import * as Core from '@formforge/core';
import { Subject, takeUntil } from 'rxjs';
import { LitFormContext } from '../context/form.context';
import { WithField } from '@formforge/core';

export abstract class BaseAdapter<F extends Core.FormField> {
  context!: LitFormContext<WithField>;
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
    templateData: ExtraProps,
  ) {
    this.context.store.state$.pipe(takeUntil(this.destroy$), Core.currentStates).subscribe(() => {
      const props = this.field.props;
      if (props !== undefined) {
        type ExtraProps = Record<string, any>;
        // we dont want 'label.register', we only want the base keys 'label' (even if they are not set)
        const uniquePropsWithoutState = Array.from(
          new Set(Object.keys(props).map((prop) => prop.split('.')[0])).keys(),
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

        templateData = {
          ...templateData,
          ...updatedProps,
        };
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
