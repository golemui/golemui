import { gui } from '@golemui/gui-shared';

export const otpTab = gui.layouts.grid([
  gui.inputs.otp('otp.verification', {
    label: 'Verification code',
    hint: 'Six digits. Paste 123-456 and the dash is dropped. Leave it half typed for an error',
    validator: {
      required: true,
      exactLength: 6,
      messages: {
        required: 'Enter the code',
        invalid: 'Enter the code',
        exactLength: 'Enter all 6 digits',
      },
    },
  }),
  gui.inputs.otp('otp.grouped', {
    label: 'Grouped',
    hint: 'Two groups of three',
    groups: [3, 3],
    defaultValue: '123',
  }),
  gui.inputs.otp('otp.short', {
    label: 'Four digits',
    hint: "Four digits: the validator's exactLength sets the length",
    validator: {
      required: true,
      exactLength: 4,
      messages: {
        required: 'Enter the code',
        invalid: 'Enter the code',
        exactLength: 'The code has four digits',
      },
    },
  }),
  gui.inputs.otp('otp.disabled', { label: 'Disabled', disabled: true, defaultValue: '482913' }),
  gui.inputs.otp('otp.readonly', { label: 'Read-only', readonly: true, defaultValue: '482913' }),
  // A code lines up with the fields beside it.
  gui.layouts.horizontalGrid([
    gui.inputs.textInput('otp.email', { label: 'Email', hint: 'Where we sent the code' }),
    gui.inputs.otp('otp.emailCode', { label: 'Email code', validator: { exactLength: 4 } }),
  ]),
]);
