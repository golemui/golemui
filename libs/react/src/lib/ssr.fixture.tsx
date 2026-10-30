import type {
  ActionWidget,
  DisplayWidget,
  FormInitConfig,
  InputWidget,
  LayoutWidget,
  NonFunctionWidget,
  ValidatorFn,
  WithWidget,
} from '@golemui/core';
import { useEffect, useLayoutEffect } from 'react';
import WidgetRenderer from './WidgetRenderer';
import { useActionWidget } from './hooks/useActionWidget';
import { useDisplayWidget } from './hooks/useDisplayWidget';
import { useInputWidget } from './hooks/useInputWidget';
import { useLayoutWidget } from './hooks/useLayoutWidget';

/**
 * Stub widgets and a form definition shared by the server render specs and the hook specs.
 *
 * The widgets use the real hooks and the real WidgetRenderer, so a value that reaches the
 * markup was read from the store through the same path the shipped widgets use.
 */

export type InputHookOutput<T = unknown> = ReturnType<
  typeof useInputWidget<T, Record<string, any>>
>;
export type ActionHookOutput = ReturnType<typeof useActionWidget<Record<string, any>>>;
export type LayoutHookOutput = ReturnType<typeof useLayoutWidget<Record<string, any>>>;
export type DisplayHookOutput = ReturnType<typeof useDisplayWidget<Record<string, any>>>;

/**
 * One render of a stub widget: the widget uid, the widget prop it got, and what its hook
 * returned.
 */
export type HookOutputRecord = { uid: string; widget: WithWidget['widget']; output: unknown };

/** One record per committed render of a stub widget. Clear it between specs. */
export const hookOutputs: HookOutputRecord[] = [];

// Effects never run during a server render, and renderToString warns on useLayoutEffect.
const useBrowserLayoutEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect;

/** Records in an effect, so a render that React runs and then discards is not recorded. */
function useRecordHookOutput(uid: string, widget: WithWidget['widget'], output: unknown) {
  useBrowserLayoutEffect(() => {
    hookOutputs.push({ uid, widget, output });
  });
}

/**
 * @param uid - The uid of the widget, with row indexes inside a repeater row.
 * @returns What the hook of that widget returned on its last committed render.
 */
export function lastHookOutput<Output>(uid: string): Output {
  for (let index = hookOutputs.length - 1; index >= 0; index--) {
    if (hookOutputs[index].uid === uid) {
      return hookOutputs[index].output as Output;
    }
  }
  throw new Error(`No render of the widget "${uid}" was recorded`);
}

function StubTextInput(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<string, string>;
  const output = useInputWidget<string, Record<string, any>>(widget);
  useRecordHookOutput(output.uid, widgetInstance.widget, output);
  const { uid, value, templateData } = output;

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
  const output = useLayoutWidget<Record<string, any>>(
    widgetInstance.widget as LayoutWidget<string>,
  );
  useRecordHookOutput(output.uid, widgetInstance.widget, output);
  const { uid, children } = output;

  return (
    <div className="stub-flex" id={uid}>
      {(children as NonFunctionWidget<string>[]).map((child) => (
        <WidgetRenderer key={child.uid} widget={child} />
      ))}
    </div>
  );
}

/** Renders one row layout per row of its array value. */
function StubRepeater(widgetInstance: WithWidget) {
  const output = useInputWidget<unknown[], Record<string, any>>(
    widgetInstance.widget as InputWidget<unknown[], string>,
  );
  useRecordHookOutput(output.uid, widgetInstance.widget, output);

  return (
    <div className="stub-repeater" id={output.uid}>
      {(output.templateData.rows ?? []).map((row) => (
        <WidgetRenderer key={row.uid} widget={row} />
      ))}
    </div>
  );
}

/** A plain button, so a click never submits the form. The specs call the hook functions. */
function StubButton(widgetInstance: WithWidget) {
  const output = useActionWidget<Record<string, any>>(
    widgetInstance.widget as ActionWidget<string>,
  );
  useRecordHookOutput(output.uid, widgetInstance.widget, output);

  return (
    <button type="button" id={output.uid}>
      {output.templateData.label as string}
    </button>
  );
}

function StubText(widgetInstance: WithWidget) {
  const output = useDisplayWidget<Record<string, any>>(
    widgetInstance.widget as DisplayWidget<string>,
  );
  useRecordHookOutput(output.uid, widgetInstance.widget, output);

  return <p id={output.uid}>{output.templateData.text as string}</p>;
}

type StubComponent = React.ComponentType<WithWidget>;

export const stubWidgetLoaders = {
  textinput: async (): Promise<StubComponent> => StubTextInput,
  flex: async (): Promise<StubComponent> => StubFlex,
  repeater: async (): Promise<StubComponent> => StubRepeater,
  button: async (): Promise<StubComponent> => StubButton,
  text: async (): Promise<StubComponent> => StubText,
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
