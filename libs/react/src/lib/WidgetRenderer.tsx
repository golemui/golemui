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
  const [Component, setComponent] = useState<WidgetComponent | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const loadComponent = async () => {
      try {
        const loadedComponent = await formContext.widgetRegistry.loadWidget(props.widget.type);
        if (isMounted.current) {
          setComponent(() => loadedComponent);
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
