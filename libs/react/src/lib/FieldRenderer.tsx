import * as Core from '@golemui/core';
import { useEffect, useRef, useState } from 'react';
import { useRepeaterIndex } from './RepeaterIndexContext';

type Props = {
  field: Core.FormField<string>;
  formContext: Core.FormContext<React.ComponentType<Core.WithField>>;
  repeaterIndex?: number;
};

type FieldComponent = React.ComponentType<Core.WithField>;

function FieldRenderer(props: Props) {
  const [Component, setComponent] = useState<FieldComponent | null>(null);
  const [field, setField] = useState(props.field);
  const isMounted = useRef(true);
  const repeaterIndexFromContext = useRepeaterIndex();
  const repeaterIndex = props.repeaterIndex ?? repeaterIndexFromContext;

  useEffect(() => {
    isMounted.current = true;
    const loadComponent = async () => {
      try {
        const loadedComponent = await props.formContext.fieldRegistry.loadField(props.field.widget);
        if (isMounted.current) {
          if (repeaterIndex > -1) {
            setField(Core.makeRepeaterItemConfig(Core.cloneObject(props.field), repeaterIndex));
          }
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
  }, [props.field, repeaterIndex, props.formContext.fieldRegistry, props.formContext.store]);

  if (!Component) {
    return null;
  }

  return <Component field={field} />;
}

export default FieldRenderer;
