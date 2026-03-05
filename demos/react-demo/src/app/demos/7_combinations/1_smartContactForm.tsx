import { DxRuntimeParams } from '../../../services/dx/formDef.domain';
import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs } from '../../../services/dx/shortcuts/inputs/guiInputs.impl';
import { _guiButton } from '../../../services/dx/shortcuts/actions/guiActions.impl';
import { _guiHorizontalStack } from '../../../services/dx/shortcuts/layouts/guiStack.impl';
import { _gslTag } from '../../../services/dx/shortcuts/scopes/gslTag.impl';
import { _gslInputs } from '../../../services/dx/shortcuts/inputs/gslInputs.impl';
import { _gslRoot } from '../../../services/dx/shortcuts/scopes/gslRoot.impl';
import { _gslActionById } from '../../../services/dx/shortcuts/actions/gslActionById.impl';
import { _gslLayoutById } from '../../../services/dx/shortcuts/layouts/gslLayoutById.impl';
import { _guiCalendar } from '../../../services/dx/shortcuts/calendar/guiCalendar.impl';
import { _guiTextarea } from '../../../services/dx/shortcuts/textarea/guiTextarea.impl';
import { _guiTextInput } from '../../../services/dx/shortcuts/inputs/guiTextInput.impl';

interface ContactForm {
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  subscribe: boolean;
  message: string;
  textArea: string;
  birthDate: string;
}

export const smartContactFormDemo: FormDemoDefinition = {
  title: 'Combinations / Smart Contact Form',
  category: 'Combinations',
  description:
    'Every feature in one form: display shortcuts, input shortcuts, full objects, tags, nested layouts, input callbacks, button callbacks, GSL runtime functions, _gslRoot with children + defaults, _gslActionById, and _gslLayoutById',
  formDefSource: `interface ContactForm {
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  subscribe: boolean;
  message: string;
  textArea: string;
  birthDate: string;
}

[
  // Plain function — auto-wrapped into _guiDisplay
  () => <h2>Smart Contact Form</h2>,
  _guiHorizontalStack(
    _guiInputs({
      firstName: ['string', 'required'],
      lastName: ['string', 'required'],
    }),
  ),
  _guiTextInput('email', {
    placeholder: 'you@example.com',
    validator: { pattern: '^[^@]+@[^@]+$' },
  }),
  _guiTextInput('message', (params) => ({
    label:
      params.errors != null && params.errors.length > 0
        ? 'Message too short!'
        : 'Message',
    placeholder: 'At least 10 chars',
    validator: { minLength: 10 },
  })),
  _guiInputs({
    age: ['number', 'required'],
    subscribe: 'boolean',
  }),
  _guiTextarea('textArea', { placeholder: 'Placeholder text' }),
  _guiCalendar('birthDate'),
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
    _guiTextInput('email', {
      placeholder: 'you@example.com',
      validator: { pattern: '^[^@]+@[^@]+$' },
    }),
    _guiTextInput('message', (params) => ({
      label: params.errors != null && params.errors.length > 0 ? 'Message too short!' : 'Message',
      placeholder: 'At least 10 chars',
      validator: { minLength: 10 },
    })),
    _guiInputs({
      age: ['number', 'required'],
      subscribe: 'boolean',
    }),
    _guiTextarea('textArea', { placeholder: 'Placeholder text' }),
    _guiCalendar('birthDate'),
    (params: DxRuntimeParams<ContactForm>) => {
      const name = params.$form?.firstName;
      if (!name) return null;
      return (
        <p style={{ color: '#2563eb', fontStyle: 'italic' }}>
          Welcome, {name}! Please complete the form below.
        </p>
      );
    },
    _guiButton((params) => ({
      label: params.$form?.firstName ? `Send for ${params.$form.firstName}` : 'Send',
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
            : (('placeholder' in cur ? cur.placeholder : undefined) ?? cur.path),
        }),
      }),
    ),
    _gslRoot(
      _gslInputs({
        decorator: (cur) => ({
          placeholder: ('placeholder' in cur ? cur.placeholder : undefined) ?? `Enter ${cur.path}`,
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
