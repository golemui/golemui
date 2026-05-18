import { type FormDemoDefinition } from '../../formRegistry.domain';
import { gui, type DxRuntimeParams } from '@golemui/gui-shared';

export const dynamicDisplayDemo: FormDemoDefinition = {
  title: '33. Dynamic Display',
  category: 'Ch7: Dynamic',
  description:
    'Any function in the form definition becomes a reactive display — it re-renders whenever form state changes. ' +
    'Use it for headings, summaries, error blocks, or conditional UI. Plain functions are auto-wrapped; ' +
    'use gui.displays.display for explicit control.',
  formDef: () => [
    () => <h2>Contact Us</h2>,
    gui.inputs.textInput('firstName'),
    gui.inputs.textInput('lastName'),
    gui.inputs.textInput('email', {
      placeholder: 'you@example.com',
      validator: { required: true, pattern: '^[^@]+@[^@]+$' },
    }),
    (params: DxRuntimeParams) =>
      params?.$form?.firstName ? <p>Welcome, {params.$form.firstName}!</p> : null,
    gui.displays.display((params: DxRuntimeParams) => {
      const errors = params?.errors;
      if (!errors || errors.length > 0) return null;
      return <div style={{ color: 'green', marginTop: '0.5rem' }}>All fields valid!</div>;
    }),
  ],
};
