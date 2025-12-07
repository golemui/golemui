import { combineLatest, Observable, takeUntil } from 'rxjs';
import { FormContext } from './context';
import { FormField } from './form-field';
import { currentStates, fieldPropOverridesByUid$ } from './store/selectors';

/**
 * Listen to the form states stream and keep all `props` in sync with the current state
 *
 * @param options - Configuration object
 * @param options.field - The form field to monitor
 * @param options.context - The form context instance
 * @param options.updaterFn - Callback to update props using the framework preferred method
 * @param options.destroy$ - Observable that signals when to unsubscribe from state changes
 */
export const propsUpdaterByCurrentState = <
  ExtraProps extends Record<string, any>,
  F extends FormField<string>,
>({
  field,
  context,
  updaterFn,
  destroy$,
}: {
  field: F;
  context: FormContext<any>;
  updaterFn: (updatedProps: Record<string, any>) => void;
  destroy$: Observable<any>;
}) => {
  const getFieldOverrides$ = fieldPropOverridesByUid$(field.uid);
  combineLatest([currentStates(context.store.state$), getFieldOverrides$(context.store.state$)])
    .pipe(takeUntil(destroy$))
    .subscribe(([_, fieldOverrides]) => {
      const props = { ...field.props, ...fieldOverrides };
      if (props !== undefined) {
        // we dont want 'label.register', we only want the base keys 'label' (even if they are not set)
        const uniquePropsWithoutState = Array.from(
          new Set(Object.keys(props).map((prop) => prop.split('.')[0])).keys(),
        );
        const updatedProps = uniquePropsWithoutState.reduce(
          (templateData, key: keyof ExtraProps) => {
            templateData[key] = context.getPropertyValueByCurrentState(key as string, props) as any;
            return templateData;
          },
          {} as ExtraProps,
        );

        updaterFn(updatedProps);
      }
    });
};
