import type {
  FormInitConfig,
  InputWidget,
  LayoutWidget,
  NonFunctionWidget,
  ValidatorFn,
  WithWidget,
} from '@golemui/core';
import WidgetRenderer from './WidgetRenderer';
import { useInputWidget } from './hooks/useInputWidget';
import { useLayoutWidget } from './hooks/useLayoutWidget';

/**
 * Stub widgets and a form definition shared by the server render specs.
 *
 * The widgets use the real hooks and the real WidgetRenderer, so a value that reaches the
 * markup was read from the store through the same path the shipped widgets use.
 */

function StubTextInput(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<string, string>;
  const { uid, value, templateData } = useInputWidget<string, Record<string, any>>(widget);

  // readOnly only prevents React's controlled-input warning, the specs never type into it.
  return (
    <input
      type="text"
      id={uid}
      name={widget.path}
      data-label={templateData.label as string}
      value={value ?? ''}
      readOnly
    />
  );
}

function StubFlex(widgetInstance: WithWidget) {
  const { uid, children } = useLayoutWidget<Record<string, any>>(
    widgetInstance.widget as LayoutWidget<string>,
  );

  return (
    <div className="stub-flex" id={uid}>
      {(children as NonFunctionWidget<string>[]).map((child) => (
        <WidgetRenderer key={child.uid} widget={child} />
      ))}
    </div>
  );
}

type StubComponent = React.ComponentType<WithWidget>;

export const stubWidgetLoaders = {
  textinput: async (): Promise<StubComponent> => StubTextInput,
  flex: async (): Promise<StubComponent> => StubFlex,
};

/** Accepts everything. The specs assert on markup, not on validation. */
export const noopValidators: ValidatorFn<any> = () =>
  ({
    '~standard': {
      version: 1,
      vendor: 'golemui-ssr-fixture',
      validate: (value: unknown) => ({ value }),
    },
  }) as ReturnType<ValidatorFn<any>>;

export const formDef = {
  form: {
    uid: 'root',
    kind: 'layout',
    type: 'flex',
    children: [
      { kind: 'input', type: 'textinput', path: 'firstName', label: 'First name' },
      { kind: 'input', type: 'textinput', path: 'lastName', label: 'Last name' },
    ],
  },
};

export const formData = { firstName: 'Ada', lastName: 'Lovelace' };

export function buildConfig(): FormInitConfig<StubComponent> {
  return {
    formDef,
    widgetLoaders: stubWidgetLoaders,
    data: formData,
  };
}
