import * as Core from '@golemui/core';
import { useEffect, useRef, useState } from 'react';
import WidgetErrorBoundary from './WidgetErrorBoundary';
import { useReactFormContext } from './ReactFormContext';
import { useRepeaterIndex } from './RepeaterIndexContext';

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
  const repeaterIndexFromContext = useRepeaterIndex();
  const repeaterIndex = props.repeaterIndex ?? repeaterIndexFromContext;

  useEffect(() => {
    isMounted.current = true;
    const loadComponent = async () => {
      try {
        const loadedComponent = await formContext.widgetRegistry.loadWidget(props.widget.type);
        if (isMounted.current) {
          if (repeaterIndex > -1) {
            setWidget(Core.makeRepeaterItemConfig(Core.cloneObject(props.widget), repeaterIndex));
          }
          setComponent(() => loadedComponent);
        }
      } catch {
        formContext.store.dispatch({
          type: 'SET_FORM_HEALTH',
          payload: {
            formHealth: {
              status: 'errored',
              message: `Widget "${props.widget.type}" could not be loaded`,
            },
          },
        });
      }
    };

    loadComponent();
    return () => {
      isMounted.current = false;
    };
  }, [props.widget, repeaterIndex, formContext.widgetRegistry, formContext.store]);

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
