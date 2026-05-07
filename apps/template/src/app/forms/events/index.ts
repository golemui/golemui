import { gui } from '@golemui/gui-shared';

// onClick — button fires an event; handler stamps the time on a sibling field.
export const eventsClickDemo = {
  data: {},
  form: [
    gui.actions.button({
      label: 'Click me',
      onClick: 'evClick',
    }),
    gui.inputs.textInput('evClickResult', {
      label: 'Last click',
      readonly: true,
      hint: 'Click the button.',
    }),
  ],
  resources: {},
};

// onChange — textinput's value flows into a sibling field's hint live.
export const eventsChangeDemo = {
  data: {},
  form: [
    gui.inputs.textInput('evSource', {
      label: 'Type something',
      onChange: 'evChange',
    }),
    gui.inputs.textInput('evChangeResult', {
      label: 'Live value',
      readonly: true,
      hint: 'Type something to see live changes.',
    }),
  ],
  resources: {},
};

// onLoad + onFilter — dropdown loads items on mount, filters on typed query.
export const eventsLoadFilterDemo = {
  data: {},
  form: [
    gui.inputs.dropdown('evColorPick', {
      label: 'Pick a color',
      items: [],
      labelField: 'label',
      valueField: 'value',
      height: 120,
      inputDebounce: 300,
      onLoad: 'evLoadColors',
      onFilter: 'evFilterColors',
    }),
  ],
  resources: {},
};

// onBlur — handler updates a sibling hint when focus leaves the input.
export const eventsBlurDemo = {
  data: {},
  form: [
    gui.inputs.textInput('evEmailBlur', {
      label: 'Email',
      onBlur: 'evBlur',
    }),
    gui.inputs.textInput('evBlurResult', {
      label: 'Status',
      readonly: true,
      hint: 'Tab out of the email field above.',
    }),
  ],
  resources: {},
};

// submit — special event: triggers form-level validation, then fires `submit`.
export const eventsSubmitDemo = {
  data: {},
  form: [
    gui.inputs.textInput('evEmail', {
      label: 'Email',
      validator: {
        type: 'string',
        required: true,
        format: 'email',
        messages: {
          required: 'An email is required',
          format: 'Enter a valid email',
        },
      },
    }),
    gui.actions.submitButton({ label: 'Submit' }),
    gui.inputs.textInput('evSubmittedEmail', {
      label: 'Result',
      readonly: true,
      hint: 'Enter a valid email and click Submit.',
    }),
  ],
  resources: {},
};
