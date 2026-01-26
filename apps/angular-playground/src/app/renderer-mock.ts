import { Component } from '@angular/core';
import { defineForm } from '@golemui/core';

const data = {
  details: {
    clientName: 'Pedro',
  },
};

@Component({
  template: `<h1>JAJA</h1>`,
})
class SampleComponent {}

const form = defineForm({
  form: [
    {
      uid: 'renderer-component',
      kind: 'display',
      widget: 'renderer',
      props: {
        render: () => {
          return SampleComponent;
        },
      },
    },
    {
      uid: 'input-name',
      kind: 'control',
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
      kind: 'interactive',
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
