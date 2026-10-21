import { type ActionWidget } from '@golemui/core';
import { useCallback, useEffect, useRef } from 'react';
import { useReactFormContext } from '../ReactFormContext';
import { mergeViewModelIntoTemplateData, type WithFlattenedProps } from './internal/template-data';
import { useViewModelAccumulator, useWidgetViewModel } from './internal/use-widget-view-model';

type ActionTemplateData<ExtraProps extends Record<string, any>> = WithFlattenedProps<
  ActionWidget<string>,
  ExtraProps
> & { invalid?: boolean };

export function useActionWidget<ExtraProps extends Record<string, any>>(
  widget: ActionWidget<string>,
) {
  const { formContext } = useReactFormContext();

  const viewModel = useWidgetViewModel(formContext.store, widget.uid);
  const templateData = useViewModelAccumulator<ActionTemplateData<ExtraProps>>(
    viewModel,
    (previous, currentViewModel) =>
      mergeViewModelIntoTemplateData(
        previous ?? ({} as ActionTemplateData<ExtraProps>),
        currentViewModel,
        formContext.dependencies,
        (vm) => ({ invalid: vm.formInvalid }),
      ),
  );

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

  /**
   * Emits `click` with a detail, such as the value of the item picked in a menu. `onClick` takes
   * no detail, so a DOM event handed to it never ends up in the form event.
   */
  const emitClick = useCallback(
    (detail?: unknown) => {
      formContext.emitEvent('click', widget, detail);
    },
    [widget, formContext],
  );

  /**
   * Validates the whole form and emits the submit event when the form is valid. Does nothing
   * unless the widget's `actionType` is `submit`, like a DOM button of type `button`.
   *
   * A widget calls it after `onClick` when the host has no form element to submit. In the DOM
   * the form element already submits, so a DOM button only needs `onClick`.
   */
  const onSubmit = useCallback(() => {
    if (widget.actionType !== 'submit') {
      return;
    }
    formContext.emitSubmitEvent();
  }, [widget, formContext]);

  return {
    uid: widget.uid,
    templateData,
    onClick,
    emitClick,
    onSubmit,
  };
}
