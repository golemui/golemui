import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.tags('keywords', {
    label: 'Keywords',
    hint: 'Between 1 and 5 tags',
    placeholder: 'Add a keyword…',
    validator: {
      required: true,
      minItems: 1,
      maxItems: 5,
      messages: {
        required: 'Please add at least one keyword',
        minItems: 'You need at least 1 keyword to continue',
        maxItems: 'No more than 5 keywords, please',
      },
    },
  }),
];
