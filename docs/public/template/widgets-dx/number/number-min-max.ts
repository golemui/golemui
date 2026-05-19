import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.numberInput('height', {
    placeholder: 'Please enter your height in meters (min 0 and max 2.5)',
    minimum: 0,
    maximum: 2.5,
    label: 'Height in meters',
    validator: {
      minimum: 0,
      maximum: 2.5,
    },
  }),
];
