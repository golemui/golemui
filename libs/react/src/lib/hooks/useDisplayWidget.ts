import { type DisplayWidget, widgetViewModel$ } from '@golemui/core';
import { useEffect, useState } from 'react';
import { useReactFormContext } from '../ReactFormContext';
import { mergeViewModelIntoTemplateData, type WithFlattenedProps } from './internal/template-data';

export function useDisplayWidget<ExtraProps extends Record<string, any>>(
  widget: DisplayWidget<string>,
) {
  const { formContext } = useReactFormContext();
  const [templateData, setTemplateData] = useState(
    {} as WithFlattenedProps<DisplayWidget<string>, ExtraProps>,
  );

  useEffect(() => {
    const sub = formContext.store.state$
      .pipe(widgetViewModel$(widget.uid))
      .subscribe((viewModel) => {
        setTemplateData((current) =>
          mergeViewModelIntoTemplateData(current, viewModel, formContext.dependencies),
        );
      });
    return () => sub.unsubscribe();
  }, [widget, formContext]);

  return {
    uid: widget.uid,
    templateData,
  };
}
