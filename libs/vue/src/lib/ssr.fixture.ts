/* eslint-disable vue/one-component-per-file -- this fixture file intentionally defines all stub widgets. */
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
import { defineComponent, h, type Component } from 'vue';
import WidgetRenderer from './WidgetRenderer.vue';
import {
  type UseActionWidgetReturn,
  type UseDisplayWidgetReturn,
  type UseInputWidgetReturn,
  type UseLayoutWidgetReturn,
  useActionWidget,
  useDisplayWidget,
  useInputWidget,
  useLayoutWidget,
} from './composables';

/**
 * Stub widgets and a form definition shared by the server render specs and the composable
 * specs.
 *
 * The widgets are render functions instead of single file components so they compile the
 * same way under the node and the jsdom test environments. They use the real
 * composables, so a value that reaches the markup was read from the store.
 */

export type InputComposableOutput<T = unknown> = UseInputWidgetReturn<T, Record<string, any>>;
export type ActionComposableOutput = UseActionWidgetReturn<Record<string, any>>;
export type LayoutComposableOutput = UseLayoutWidgetReturn<Record<string, any>>;
export type DisplayComposableOutput = UseDisplayWidgetReturn<Record<string, any>>;

/** One render of a stub widget: the widget uid and what its composable returned. */
export type ComposableOutputRecord = { uid: string; output: unknown };

/**
 * One record per render of a stub widget, in render order, so a spec can count renders. Every
 * record of a widget holds the same output object. Clear it between specs.
 */
export const composableOutputs: ComposableOutputRecord[] = [];

/**
 * @param uid - The uid of the widget, with row indexes inside a repeater row.
 * @returns What the composable of that widget returned. Its refs hold the current values.
 */
export function lastComposableOutput<Output>(uid: string): Output {
  for (let index = composableOutputs.length - 1; index >= 0; index--) {
    if (composableOutputs[index].uid === uid) {
      return composableOutputs[index].output as Output;
    }
  }
  throw new Error(`No render of the widget "${uid}" was recorded`);
}

const StubTextInput = defineComponent({
  name: 'StubTextInput',
  props: { widget: { type: Object, required: true } },
  setup(props) {
    const widget = props.widget as InputWidget<string, string>;
    const output = useInputWidget<string>(widget);
    const { uid, value, templateData } = output;

    return () => {
      composableOutputs.push({ uid: uid.value, output });
      return h('input', {
        type: 'text',
        id: uid.value,
        name: widget.path,
        'data-label': templateData.value.label,
        value: value.value ?? '',
      });
    };
  },
});

const StubFlex = defineComponent({
  name: 'StubFlex',
  props: { widget: { type: Object, required: true } },
  setup(props) {
    const output = useLayoutWidget(props.widget as LayoutWidget);
    const { uid, children, templateData } = output;

    return () => {
      composableOutputs.push({ uid: uid.value, output });
      return h(
        'div',
        // Reads templateData like a real layout, so a templateData change renders it again.
        { class: 'stub-flex', id: uid.value, 'data-label': templateData.value.label },
        (children.value as NonFunctionWidget<string>[]).map((child) =>
          h(WidgetRenderer, { key: child.uid, widget: child }),
        ),
      );
    };
  },
});

/** Renders one row layout per row of its array value. */
const StubRepeater = defineComponent({
  name: 'StubRepeater',
  props: { widget: { type: Object, required: true } },
  setup(props) {
    const output = useInputWidget<unknown[]>(props.widget as InputWidget<unknown[], string>);

    return () => {
      composableOutputs.push({ uid: output.uid.value, output });
      return h(
        'div',
        { class: 'stub-repeater', id: output.uid.value },
        (output.templateData.value.rows ?? []).map((row) =>
          h(WidgetRenderer, { key: row.uid, widget: row }),
        ),
      );
    };
  },
});

/** A plain button, so a click never submits the form. */
const StubButton = defineComponent({
  name: 'StubButton',
  props: { widget: { type: Object, required: true } },
  setup(props) {
    const output = useActionWidget(props.widget as ActionWidget<string>);

    return () => {
      composableOutputs.push({ uid: output.uid.value, output });
      return h(
        'button',
        { type: 'button', id: output.uid.value },
        output.templateData.value.label as string,
      );
    };
  },
});

const StubText = defineComponent({
  name: 'StubText',
  props: { widget: { type: Object, required: true } },
  setup(props) {
    const output = useDisplayWidget(props.widget as DisplayWidget<string>);

    return () => {
      composableOutputs.push({ uid: output.uid.value, output });
      return h('p', { id: output.uid.value }, output.templateData.value.text);
    };
  },
});

export const stubWidgetLoaders = {
  textinput: async (): Promise<Component<WithWidget>> => StubTextInput as Component<WithWidget>,
  flex: async (): Promise<Component<WithWidget>> => StubFlex as Component<WithWidget>,
  repeater: async (): Promise<Component<WithWidget>> => StubRepeater as Component<WithWidget>,
  button: async (): Promise<Component<WithWidget>> => StubButton as Component<WithWidget>,
  text: async (): Promise<Component<WithWidget>> => StubText as Component<WithWidget>,
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
      // The `load` handler lets the specs pin down when the event fires: never on the server,
      // once the client has mounted.
      {
        kind: 'input',
        type: 'textinput',
        path: 'firstName',
        label: 'First name',
        on: { load: 'stubLoaded' },
      },
      { kind: 'input', type: 'textinput', path: 'lastName', label: 'Last name' },
    ],
  },
};

export const formData = { firstName: 'Ada', lastName: 'Lovelace' };

export function buildConfig(): FormInitConfig<Component<WithWidget>> {
  return {
    formDef,
    widgetLoaders: stubWidgetLoaders,
    data: formData,
  };
}
