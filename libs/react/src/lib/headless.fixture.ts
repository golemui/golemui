import type {
  ActionWidget,
  FormInitConfig,
  InputWidget,
  LayoutWidget,
  NonFunctionWidget,
  ValidatorFn,
  WithWidget,
} from '@golemui/core';
import { type ComponentType, createElement } from 'react';
import WidgetRenderer from './WidgetRenderer';
import type { WidgetErrorFallback } from './WidgetErrorBoundary';
import { useActionWidget } from './hooks/useActionWidget';
import { useInputWidget } from './hooks/useInputWidget';
import { useLayoutWidget } from './hooks/useLayoutWidget';

/**
 * Stub widgets and form definitions for the headless specs.
 *
 * The widgets render `stub-*` host elements only, through the real hooks and the real
 * WidgetRenderer. A spec calls the handler props of those elements in place of user input.
 */

/** Its `onType` prop replaces the value, like a user typing. */
function StubTextInput(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<string, string>;
  const { value, templateData, onValueChanged } = useInputWidget<string, Record<string, any>>(
    widget,
  );

  return createElement('stub-input', {
    label: templateData.label,
    value: value ?? '',
    onType: (text: string) => onValueChanged(text),
  });
}

/** Its `onPress` prop runs the click and then the submit, as a host without a form element must. */
function StubButton(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as ActionWidget<string>;
  const { templateData, onClick, onSubmit } = useActionWidget<Record<string, any>>(widget);

  return createElement('stub-button', {
    label: templateData.label,
    onPress: () => {
      onClick();
      onSubmit();
    },
  });
}

function StubGrid(widgetInstance: WithWidget) {
  const { children } = useLayoutWidget<Record<string, any>>(
    widgetInstance.widget as LayoutWidget<string>,
  );

  return createElement(
    'stub-grid',
    null,
    (children as NonFunctionWidget<string>[]).map((child) =>
      createElement(WidgetRenderer, { key: child.uid, widget: child }),
    ),
  );
}

/** Always throws, so a spec can assert on the widget error fallback. */
function StubThrowingWidget(): never {
  throw new Error('stub widget failed on purpose');
}

type StubComponent = ComponentType<WithWidget>;

export const stubWidgetLoaders = {
  textinput: async (): Promise<StubComponent> => StubTextInput,
  button: async (): Promise<StubComponent> => StubButton,
  grid: async (): Promise<StubComponent> => StubGrid,
  throwing: async (): Promise<StubComponent> => StubThrowingWidget as StubComponent,
};

/** The element types the stub widgets render. */
export const stubWidgetHostTypes = ['stub-grid', 'stub-input', 'stub-button'];

/** Accepts everything. The specs assert on rendered elements and events, not on validation. */
export const noopValidators: ValidatorFn<any> = () =>
  ({
    '~standard': {
      version: 1,
      vendor: 'golemui-headless-fixture',
      validate: (value: unknown) => ({ value }),
    },
  }) as ReturnType<ValidatorFn<any>>;

/** Renders the type of the widget that threw, so a spec can tell which widget failed. */
export const stubWidgetErrorFallback: WidgetErrorFallback = (_error, widget) =>
  createElement('stub-fallback', { widgetType: widget.type });

/** Both widgets carry a `load` handler, so a lost `load` event fails a spec. */
export function buildFormConfig(): FormInitConfig<StubComponent> {
  return {
    formDef: {
      form: {
        uid: 'root',
        kind: 'layout',
        type: 'grid',
        children: [
          {
            kind: 'input',
            type: 'textinput',
            path: 'firstName',
            label: 'First name',
            on: { load: 'textLoaded' },
          },
          {
            kind: 'action',
            type: 'button',
            actionType: 'submit',
            label: 'Send',
            on: { load: 'buttonLoaded' },
          },
        ],
      },
    },
    widgetLoaders: stubWidgetLoaders,
    data: {},
  };
}

/** One throwing widget next to a working one, so a spec sees the fallback and the rest of the tree. */
export function buildThrowingWidgetConfig(): FormInitConfig<StubComponent> {
  return {
    formDef: {
      form: {
        uid: 'root',
        kind: 'layout',
        type: 'grid',
        children: [
          { kind: 'display', type: 'throwing' },
          { kind: 'input', type: 'textinput', path: 'firstName', label: 'First name' },
        ],
      },
    },
    widgetLoaders: stubWidgetLoaders,
    data: { firstName: 'Ada' },
  };
}

/** A widget type with no loader next to a working one, so the form health turns errored while the rest of the tree renders. */
export function buildMissingLoaderConfig(): FormInitConfig<StubComponent> {
  return {
    formDef: {
      form: {
        uid: 'root',
        kind: 'layout',
        type: 'grid',
        children: [
          { kind: 'display', type: 'missing' },
          { kind: 'input', type: 'textinput', path: 'firstName', label: 'First name' },
        ],
      },
    },
    widgetLoaders: stubWidgetLoaders,
    data: { firstName: 'Ada' },
  };
}
