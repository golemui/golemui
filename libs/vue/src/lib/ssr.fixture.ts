/* eslint-disable vue/one-component-per-file -- this fixture file intentionally defines both stub widgets. */
import type {
  FormInitConfig,
  InputWidget,
  LayoutWidget,
  NonFunctionWidget,
  ValidatorFn,
  WithWidget,
} from '@golemui/core';
import { defineComponent, h, type Component } from 'vue';
import WidgetRenderer from './WidgetRenderer.vue';
import { useInputWidget, useLayoutWidget } from './composables';

/**
 * Stub widgets and a form definition shared by the server render specs.
 *
 * The widgets are render functions instead of single file components so they compile the
 * same way under the node and the jsdom test environments. They use the real
 * composables, so a value that reaches the markup was read from the store.
 */

const StubTextInput = defineComponent({
  name: 'StubTextInput',
  props: { widget: { type: Object, required: true } },
  setup(props) {
    const widget = props.widget as InputWidget<string, string>;
    const { uid, value, templateData } = useInputWidget<string>(widget);

    return () =>
      h('input', {
        type: 'text',
        id: uid.value,
        name: widget.path,
        'data-label': templateData.value.label,
        value: value.value ?? '',
      });
  },
});

const StubFlex = defineComponent({
  name: 'StubFlex',
  props: { widget: { type: Object, required: true } },
  setup(props) {
    const { uid, children } = useLayoutWidget(props.widget as LayoutWidget);

    return () =>
      h(
        'div',
        { class: 'stub-flex', id: uid.value },
        (children.value as NonFunctionWidget<string>[]).map((child) =>
          h(WidgetRenderer, { key: child.uid, widget: child }),
        ),
      );
  },
});

export const stubWidgetLoaders = {
  textinput: async (): Promise<Component<WithWidget>> => StubTextInput as Component<WithWidget>,
  flex: async (): Promise<Component<WithWidget>> => StubFlex as Component<WithWidget>,
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
