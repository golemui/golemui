import { FormDemoDefinition } from '../../formRegistry.domain';
import { DxRuntimeParams, _guiInputs, _guiTextInput, _guiDisplay } from '@golemui/gui-shared';

export const dynamicDisplayDemo: FormDemoDefinition = {
  title: '8. Dynamic Display',
  category: 'Ch2: Dynamic',
  description:
    'Any function in the form definition becomes a reactive display — it re-renders whenever form state changes. '
    + 'Use it for headings, summaries, error blocks, or conditional UI. Plain functions are auto-wrapped; '
    + 'use _guiDisplay for explicit control.',
  formDef: () => [
    () => <h2>Contact Us</h2>,
    _guiInputs({ firstName: 'string', lastName: 'string' }),
    _guiTextInput('email', {
      placeholder: 'you@example.com',
      validator: { required: true, pattern: '^[^@]+@[^@]+$' },
    }),
    (params: DxRuntimeParams) => params?.$form?.firstName
      ? <p>Welcome, {params.$form.firstName}!</p>
      : null,
    _guiDisplay((params: DxRuntimeParams) => {
      const errors = params?.errors;
      if (!errors || errors.length > 0) return null;
      return (
        <div style={{ color: 'green', marginTop: '0.5rem' }}>
          All fields valid!
        </div>
      );
    }),
  ],
};
