import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs, _guiTextInput } from '../../../services/dx';

export const dynamicInputDemo: FormDemoDefinition = {
  title: '6. Dynamic Input',
  category: 'Ch2: Dynamic',
  description:
    'Pass a callback instead of static props. It receives runtime params — the full form data, validation errors, touched state. '
    + 'The field re-renders whenever params change. Here the label shows an error hint when validation fails.',
  formDef: () => [
    _guiInputs({ name: 'string' }),
    _guiTextInput('email', (params) => ({
      label: params?.errors?.length ? 'Email (invalid!)' : 'Email',
      placeholder: 'you@example.com',
      validator: { required: true, pattern: '^[^@]+@[^@]+$' },
    })),
  ],
};
