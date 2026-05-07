import { gui } from '@golemui/gui-shared';

// 1. A reactive label — the checkbox label flips with its own value.
export const runtimeLabelDemo = {
  data: {},
  form: [
    gui.inputs.booleanInput('registerMode', {
      label: ({ $form }: any) =>
        $form.registerMode ? 'Switch to login' : 'Switch to register',
    }),
  ],
  resources: {},
};

// 2. A reactive validator — same widget, two validation policies.
export const runtimeValidatorDemo = {
  data: {},
  form: [
    gui.inputs.booleanInput('registerMode', { label: 'Register mode' }),
    gui.inputs.textInput('user.name', {
      label: 'Username',
      validator: ({ $form }: any) =>
        $form.registerMode
          ? {
              type: 'string',
              required: true,
              minLength: 3,
              messages: {
                required: 'Pick a username',
                minLength: 'At least 3 characters',
              },
            }
          : {
              type: 'custom',
              allowedNames: ['John', 'Jane'],
            },
    }),
  ],
  resources: {},
};

// 3. A reactive event handler — `onChange` is a runtime function that
// reads live form data and dispatches an `update` to a sibling widget.
export const runtimeEventHandlerDemo = {
  data: {},
  form: [
    gui.inputs.booleanInput('upperMode', { label: 'Convert to UPPERCASE' }),
    gui.inputs.textInput('source', {
      label: 'Source',
      placeholder: 'Type something…',
      onChange: ({ data, update }: any) => {
        const text = String(data.source ?? '');
        const transformed = data.upperMode ? text.toUpperCase() : text;
        update({
          path: 'mirror',
          hint: transformed || 'Type in the source field to see it mirrored.',
        });
      },
    }),
    gui.inputs.textInput('mirror', {
      label: 'Mirror',
      readonly: true,
      hint: 'Type in the source field to see it mirrored.',
    }),
  ],
  resources: {},
};

// 4. A reactive nested prop — the checkbox swaps left/right per mode.
export const runtimeNestedPropDemo = {
  data: {},
  form: [
    gui.inputs.booleanInput('rtlMode', {
      label: 'Right-to-left layout',
    }),
    gui.inputs.checkbox('agreed', {
      label: 'I agree',
      checkboxPosition: ({ $form }: any) =>
        $form.rtlMode ? 'right' : 'left',
    }),
  ],
  resources: {},
};

// 5. A reactive display — alert text reads $form on every change.
export const runtimeDisplayDemo = {
  data: {},
  form: [
    gui.inputs.textInput('user.name', { label: 'Your name' }),
    gui.displays.alert({
      text: ({ $form }: any) =>
        $form.user?.name
          ? `Hello ${$form.user.name}!`
          : 'Welcome — type your name above.',
      level: 'info',
    }),
  ],
  resources: {},
};
