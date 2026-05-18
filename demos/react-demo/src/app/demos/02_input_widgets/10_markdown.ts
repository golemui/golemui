import { type FormDemoDefinition } from '../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';
import snarkdown from 'snarkdown';

export const markdownDemo: FormDemoDefinition = {
  title: '10. Markdown',
  category: 'Ch2: Input Widgets',
  description:
    'A rich-text markdown editor with configurable toolbar buttons. ' +
    'Supports tools, preview toggle, and auto-generated labels from the field path.',
  formDef: () => [
    gui.inputs.textInput('name'),
    gui.inputs.markdown('bio', { tools: ['H', 'B', 'I', 'L'], placeholder: 'Write your bio...' }),
    gui.inputs.markdown('projectNotes', {
      defaultOpenPreview: true,
      hint: 'Supports markdown syntax',
    }),
  ],
  formConfig: () => ({
    onSubmit: (data: any) => console.log('Form submitted:', data),
    dependencies: { markdown: { parse: snarkdown } },
  }),
};
