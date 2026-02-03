import { Component, input } from '@angular/core';
import { defineForm, WidgetPropertyFunctionParams } from '@golemui/core';

const data = {
  details: {
    clientName: 'Pedro',
  },
};

@Component({
  template: `<h1>Client Name: {{ api().$form.details?.clientName || 'unknown' }}</h1>`,
})
class SampleComponent {
  api = input.required<WidgetPropertyFunctionParams<any>>();
}

const form = defineForm({
  form: [
    {
      uid: 'renderer-component',
      kind: 'display',
      widget: 'renderer',
      props: {
        render: (api: WidgetPropertyFunctionParams<any>) => {
          return { component: SampleComponent, api: api };
        },
      },
    },
    {
      uid: 'input-name',
      kind: 'input',
      widget: 'textinput',
      path: 'details.clientName',
      label: 'Client Name',
      props: {
        placeholder: 'e.g. Jane Doe',
      },
      validator: { type: 'string', required: true, minLength: 2 },
    },

    // 7. Submit Action
    {
      uid: 'btn-submit',
      kind: 'action',
      widget: 'button',
      on: {
        click: 'handleSubmit',
      },
      label: 'Confirm Booking',
      props: {
        title: 'Submit booking',
      },
    },
  ],
});

export const rendererMock = {
  data,
  form,
  resources: {},
};
