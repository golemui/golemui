import { defineForm } from '@golemui/core';
import { html } from 'lit';

const data = {
  details: {
    clientName: 'Pedro',
  },
};

const form = defineForm({
  form: [
    {
      uid: 'renderer-component',
      kind: 'display',
      widget: 'renderer',
      props: {
        render: (api) => {
          return html`<h1>Client Name: ${api.$form?.details?.clientName || 'unknown'}</h1>`;
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
