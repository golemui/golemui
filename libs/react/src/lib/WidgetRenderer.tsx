import { type NonFunctionWidget, type WithWidget, errorCodes } from '@golemui/core';
import { useEffect, useRef, useState } from 'react';
import WidgetErrorBoundary from './WidgetErrorBoundary';
import { useReactFormContext } from './ReactFormContext';

type Props = {
  widget: NonFunctionWidget<string>;
};

type WidgetComponent = React.ComponentType<WithWidget>;

// Repeater rows and layout children arrive from the store with their row indexes already applied to `uid` and `path`, so the renderer takes the widget as it is
function WidgetRenderer(props: Props) {
  const { formContext } = useReactFormContext();
  const [asyncLoadedComponent, setAsyncLoadedComponent] = useState<WidgetComponent | null>(null);
  const isMounted = useRef(true);

  // Read synchronously so the very first render already shows the widget. A server render
  // never runs effects and cannot await the dynamic import.
  const preloadedComponent = formContext.widgetRegistry.getIfLoaded(props.widget.type) ?? null;

  useEffect(() => {
    if (formContext.widgetRegistry.getIfLoaded(props.widget.type)) {
      return;
    }
    isMounted.current = true;
    const loadComponent = async () => {
      try {
        const loadedComponent = await formContext.widgetRegistry.loadWidget(props.widget.type);
        if (isMounted.current) {
          setAsyncLoadedComponent(() => loadedComponent);
        }
      } catch {
        const code = errorCodes.widgetCouldNotBeLoaded;
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
  }, [props.widget, formContext.widgetRegistry, formContext.store]);

  const Component = preloadedComponent ?? asyncLoadedComponent;
  if (!Component) {
    return null;
  }

  return (
    <WidgetErrorBoundary widget={props.widget}>
      <Component widget={props.widget} />
    </WidgetErrorBoundary>
  );
}

export default WidgetRenderer;
