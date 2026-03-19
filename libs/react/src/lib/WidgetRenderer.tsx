import * as Core from '@golemui/core';
import { useEffect, useMemo, useRef, useState } from 'react';
import WidgetErrorBoundary from './WidgetErrorBoundary';
import { useReactFormContext } from './ReactFormContext';
import { useRepeaterIndexes } from './RepeaterIndexesContext';

type Props = {
  widget: Core.NonFunctionWidget<string>;
  repeaterIndex?: number;
};

type WidgetComponent = React.ComponentType<Core.WithWidget>;

function WidgetRenderer(props: Props) {
  const { formContext } = useReactFormContext();
  const [Component, setComponent] = useState<WidgetComponent | null>(null);
  // We have to `() => props.widget` because when `props.widget` is a Widget Function we don't want React interprets it as a lazy initializer e.g. `useState(() => initialState)`
  const [widget, setWidget] = useState(() => props.widget);
  const isMounted = useRef(true);
  const repeaterIndexesFromContext = useRepeaterIndexes();
  const repeaterIndexes = useMemo(() => {
    if (props.repeaterIndex === undefined) {
      return repeaterIndexesFromContext;
    }
    return [...repeaterIndexesFromContext, props.repeaterIndex];
  }, [repeaterIndexesFromContext, props.repeaterIndex]);

  useEffect(() => {
    isMounted.current = true;
    const loadComponent = async () => {
      try {
        const loadedComponent = await formContext.widgetRegistry.loadWidget(props.widget.type);
        if (isMounted.current) {
          if (repeaterIndexes.length > 0) {
            setWidget(Core.makeRepeaterItemConfig(Core.cloneObject(props.widget), repeaterIndexes));
          }
          setComponent(() => loadedComponent);
        }
      } catch {
        const code = Core.errorCodes.widgetCouldNotBeLoaded;
        formContext.store.dispatch({
          type: 'SET_FORM_HEALTH',
          payload: {
            formHealth: {
              status: 'errored',
              message: `[${code}] Widget "${props.widget.type}" could not be loaded`,
              code,
            },
          },
        });
      }
    };

    loadComponent();
    return () => {
      isMounted.current = false;
    };
  }, [props.widget, repeaterIndexes, formContext.widgetRegistry, formContext.store]);

  if (!Component) {
    return null;
  }

  return (
    <WidgetErrorBoundary widget={widget}>
      <Component widget={widget} />
    </WidgetErrorBoundary>
  );
}

export default WidgetRenderer;
