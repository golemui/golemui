import * as Core from '@formforge/core';
import { useEffect, useRef, useState } from 'react';

type Props = {
  field: Core.FormField<string>;
  formContext: Core.FormContext<React.ComponentType<Core.WithField>>;
};

type FieldComponent = React.ComponentType<Core.WithField>;

function FieldRenderer(props: Props) {
  const [Component, setComponent] = useState<FieldComponent | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    const loadComponent = async () => {
      try {
        const loadedComponent = await props.formContext.fieldRegistry.loadField(
          props.field.widget,
        );
        if (isMounted.current) {
          setComponent(() => loadedComponent);
        }
      } catch {
        props.formContext.store.dispatch({
          type: 'SET_ERROR',
          payload: {
            error: {
              kind: 'fatal',
              error: `Field "${props.field.widget}" could not be loaded`,
            },
          },
        });
      }
    };

    loadComponent();
    return () => {
      isMounted.current = false;
    };
  }, [
    props.field.widget,
    props.formContext.fieldRegistry,
    props.formContext.store,
  ]);

  if (!Component) {
    return null;
  }

  return <Component field={props.field} />;
}

export default FieldRenderer;
