import { FormDemoDefinition } from '../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

export const customFieldsDemo: FormDemoDefinition = {
  title: '3. Customizing Fields',
  category: 'Ch1: Getting Started',
  description:
    'When one field needs more control — a validator, a custom placeholder, a specific prop — use the typed factory. '
    + 'IntelliSense shows every property for that specific widget type. Mix freely with batch shorthands.',
  formDef: () => [
    gui.inputs.textInput('firstName'),
    gui.inputs.textInput('lastName'),
    gui.inputs.textInput('email', { placeholder: 'you@example.com', validator: { pattern: '^[^@]+@[^@]+$' } }),
    gui.inputs.numberInput('age', { minimum: 0, maximum: 150, step: 1 }),
    gui.inputs.booleanInput('newsletter', { togglePosition: 'right' }),
  ],
};
