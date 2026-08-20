import { type ActionWidget, widgetViewModel$ } from '@golemui/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useReactFormContext } from '../ReactFormContext';
import { mergeViewModelIntoTemplateData, type WithFlattenedProps } from './internal/template-data';

export function useActionWidget<ExtraProps extends Record<string, any>>(
  widget: ActionWidget<string>,
) {
  const { formContext } = useReactFormContext();
  const [templateData, setTemplateData] = useState(
    {} as WithFlattenedProps<ActionWidget<string>, ExtraProps> & { invalid?: boolean },
  );

  useEffect(() => {
    const sub = formContext.store.state$
      .pipe(widgetViewModel$(widget.uid))
      .subscribe((viewModel) => {
        setTemplateData((current) =>
          mergeViewModelIntoTemplateData(current, viewModel, formContext.dependencies, (vm) => ({
            invalid: vm.formInvalid,
          })),
        );
      });
    return () => sub.unsubscribe();
  }, [widget, formContext]);

  // A repeater row widget arrives as a new object whenever the row set changes, so emit
  // `load` once per uid and store, not once per widget object identity.
  const lastLoad = useRef<{ store: unknown; uid: string } | undefined>(undefined);
  useEffect(() => {
    if (lastLoad.current?.store === formContext.store && lastLoad.current?.uid === widget.uid) {
      return;
    }
    lastLoad.current = { store: formContext.store, uid: widget.uid };
    formContext.emitEvent('load', widget);
  }, [formContext, widget]);

  const onClick = useCallback(() => {
    formContext.emitEvent('click', widget);
  }, [widget, formContext]);

  return {
    uid: widget.uid,
    templateData,
    onClick,
  };
}
