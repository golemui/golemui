import { type FormWidget, type LayoutWidget, widgetViewModel$ } from '@golemui/core';
import { useCallback, useEffect, useState } from 'react';
import { useReactFormContext } from '../ReactFormContext';
import { mergeViewModelIntoTemplateData, type WithFlattenedProps } from './internal/template-data';

export function useLayoutWidget<ExtraProps extends Record<string, any>>(
  widget: LayoutWidget<string>,
) {
  const { formContext } = useReactFormContext();
  const [children, setChildren] = useState<FormWidget<string>[]>([]);
  const [templateData, setTemplateData] = useState(
    {} as WithFlattenedProps<LayoutWidget<string>, ExtraProps>,
  );

  useEffect(() => {
    const sub = formContext.store.state$
      .pipe(widgetViewModel$(widget.uid))
      .subscribe((viewModel) => {
        // Keep the last children while hidden, otherwise the layout renders empty
        if (viewModel.widget !== undefined) {
          setChildren(viewModel.children);
        }
        setTemplateData((current) =>
          mergeViewModelIntoTemplateData(current, viewModel, formContext.dependencies),
        );
      });
    return () => sub.unsubscribe();
  }, [widget, formContext]);

  const onChange = useCallback(
    (detail: any) => {
      formContext.emitEvent('change', widget, detail);
    },
    [widget, formContext],
  );

  return {
    uid: widget.uid,
    children,
    templateData,
    onChange,
  };
}
