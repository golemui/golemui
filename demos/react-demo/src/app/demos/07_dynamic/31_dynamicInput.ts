import { type FormDemoDefinition } from '../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

export const dynamicInputDemo: FormDemoDefinition = {
  title: '31. Dynamic Input',
  category: 'Ch7: Dynamic',
  description:
    'Pass a callback instead of static props. It receives runtime params — the full form data, validation errors, touched state. ' +
    'The field re-renders whenever params change. Here the label shows an error hint when validation fails.',
  formDef: () => [
    gui.inputs.textInput('name'),
    gui.inputs.textInput('email', (params) => ({
      label: params?.errors?.length ? 'Email (invalid!)' : 'Email',
      placeholder: 'you@example.com',
      validator: { required: true, pattern: '^[^@]+@[^@]+$' },
    })),
  ],
};
