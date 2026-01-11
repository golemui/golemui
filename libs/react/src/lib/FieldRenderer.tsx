import * as Core from '@golemui/core';
import { useEffect, useRef, useState } from 'react';
import { useReactFormContext } from './ReactFormContext';
import { useRepeaterIndex } from './RepeaterIndexContext';

type Props = {
  field: Core.NonFunctionField<string>;
  repeaterIndex?: number;
};

type FieldComponent = React.ComponentType<Core.WithField>;

function FieldRenderer(props: Props) {
  const { formContext } = useReactFormContext();
  const [Component, setComponent] = useState<FieldComponent | null>(null);
  // We have to `() => props.field` because when `props.field` is a Field Function we don't want React interprets it as a lazy initializer e.g. `useState(() => initialState)`
  const [field, setField] = useState(() => props.field);
  const isMounted = useRef(true);
  const repeaterIndexFromContext = useRepeaterIndex();
  const repeaterIndex = props.repeaterIndex ?? repeaterIndexFromContext;

  useEffect(() => {
    isMounted.current = true;
    const loadComponent = async () => {
      try {
        const loadedComponent = await formContext.fieldRegistry.loadField(props.field.widget);
        if (isMounted.current) {
          if (repeaterIndex > -1) {
            setField(Core.makeRepeaterItemConfig(Core.cloneObject(props.field), repeaterIndex));
          }
          setComponent(() => loadedComponent);
        }
      } catch {
        formContext.store.dispatch({
          type: 'SET_FORM_HEALTH',
          payload: {
            formHealth: {
              status: 'errored',
              message: `Field "${props.field.widget}" could not be loaded`,
            },
          },
        });
      }
    };

    loadComponent();
    return () => {
      isMounted.current = false;
    };
  }, [props.field, repeaterIndex, formContext.fieldRegistry, formContext.store]);

  if (!Component) {
    return null;
  }

  return <Component field={field} />;
}

export default FieldRenderer;
