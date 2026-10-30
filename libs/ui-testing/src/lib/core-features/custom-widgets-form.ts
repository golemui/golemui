import { defineForm, type Form } from '@golemui/core';

/**
 * A custom layout with a textinput and a custom action as children. The custom widget types come
 * from the `withCustomComponent` loaders of the mount.
 */
export const customWidgetsForm = (): Form<string> =>
  defineForm({
    form: [
      {
        uid: 'box',
        kind: 'layout',
        type: 'customLayout',
        props: { title: 'Contact' },
        children: [
          { uid: 'name', kind: 'input', type: 'textinput', path: 'name' },
          {
            uid: 'save',
            kind: 'action',
            type: 'customAction',
            label: 'Save',
            on: { click: 'customClicked' },
          },
        ],
      },
    ],
  });
