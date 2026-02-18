import { DxRuntimeParams } from '../../../services/dx/formDef.domain';
import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs } from '../../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';
import { _guiButton } from '../../../services/dx/shortcuts/gui/shortcuts/guiSubmitButton.impl';
import { _guiHorizontalStack } from '../../../services/dx/shortcuts/gui/shortcuts/guiStack.impl';
import { _gslTag } from '../../../services/dx/shortcuts/gsl/gslTag.impl';
import { _gslInputs } from '../../../services/dx/shortcuts/gsl/gslInputs.impl';
import { _gslRoot } from '../../../services/dx/shortcuts/gsl/gslRoot.impl';
import { _gslActionById } from '../../../services/dx/shortcuts/gsl/gslActionById.impl';
import { _gslLayoutById } from '../../../services/dx/shortcuts/gsl/gslLayoutById.impl';

export const smartContactFormDemo: FormDemoDefinition = {
  title: 'Combinations / Smart Contact Form',
  category: 'Combinations',
  description:
    'Every feature in one form: display shortcuts, input shortcuts, full objects, tags, nested layouts, input callbacks, button callbacks, GSL runtime functions, _gslRoot with children + defaults, _gslActionById, and _gslLayoutById',
  formDefSource: `[
  // Plain function — auto-wrapped into _guiDisplay
  () => <h2>Smart Contact Form</h2>,
  _guiHorizontalStack(
    _guiInputs({
      firstName: ['string', 'required'],
      lastName: ['string', 'required'],
    }),
  ),
  _guiInputs({
    email: {
      type: 'text',
      placeholder: 'you@example.com',
      validator: { pattern: '^[^@]+@[^@]+$' },
    },
    age: ['number', 'required'],
    subscribe: 'boolean',
    message: (params) => ({
      type: 'text',
      label:
        params.errors != null && params.errors.length > 0
          ? 'Message too short!'
          : 'Message',
      placeholder: 'At least 10 chars',
      validator: { minLength: 10 },
    }),
  }),
  // Dynamic greeting — auto-wrapped into _guiDisplay
  (params) => {
    const name = params.$form?.firstName;
    if (!name) return null;
    return (
      <p style={{ color: '#2563eb', fontStyle: 'italic' }}>
        Welcome, {name}! Please complete the form below.
      </p>
    );
  },
  _guiButton((params) => ({
    label: params.$form?.firstName
      ? \`Send for \${params.$form.firstName}\`
      : 'Send',
    disabled: !params.$form?.email,
    onClick: (data) => console.log('Submitted:', data),
  })),
]`,
  formDef: () => [
    () => <h2>Smart Contact Form</h2>,
    _guiHorizontalStack(
      _guiInputs({
        firstName: ['string', 'required'],
        lastName: ['string', 'required'],
      }),
    ),
    _guiInputs({
      email: {
        type: 'text',
        placeholder: 'you@example.com',
        validator: { pattern: '^[^@]+@[^@]+$' },
      },
      age: ['number', 'required'],
      subscribe: 'boolean',
      message: (params) => ({
        type: 'text',
        label:
          params.errors != null && params.errors.length > 0
            ? 'Message too short!'
            : 'Message',
        placeholder: 'At least 10 chars',
        validator: { minLength: 10 },
      }),
    }),
    (params: DxRuntimeParams) => {
      const name = params.$form?.firstName;
      if (!name) return null;
      return (
        <p style={{ color: '#2563eb', fontStyle: 'italic' }}>
          Welcome, {name}! Please complete the form below.
        </p>
      );
    },
    _guiButton((params) => ({
      label: params.$form?.firstName
        ? `Send for ${params.$form.firstName}`
        : 'Send',
      disabled: !params.$form?.email,
      onClick: (data: any) => console.log('Submitted:', data),
    })),
  ],
  formSelectors: () => [
    _gslTag(
      'required',
      _gslInputs({
        decorator: (cur) => (params) => ({
          placeholder: params?.$form?.firstName
            ? `Hi ${params.$form.firstName}! Fill ${cur.path}`
            : cur.placeholder ?? cur.path,
        }),
      }),
    ),
    _gslRoot(
      _gslInputs({
        decorator: (cur) => ({
          placeholder: cur.placeholder ?? `Enter ${cur.path}`,
        }),
      }),
      { onSubmit: (data: any) => alert('Root onSubmit: ' + JSON.stringify(data)) },
    ),
    _gslActionById('#submit', {
      decorator: { onClick: (data: any) => alert(JSON.stringify(data, null, 2)) },
    }),
    _gslLayoutById('#root', {
      decorator: { direction: 'vertical' },
    }),
  ],
};
