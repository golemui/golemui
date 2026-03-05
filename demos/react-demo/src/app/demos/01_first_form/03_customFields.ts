import { FormDemoDefinition } from '../../formRegistry.domain';
import {
  _guiInputs,
  _guiTextInput,
  _guiNumberInput,
  _guiBooleanInput,
} from '../../../services/dx';

export const customFieldsDemo: FormDemoDefinition = {
  title: '3. Customizing Fields',
  category: 'Ch1: First Form',
  description:
    'When one field needs more control — a validator, a custom placeholder, a specific prop — use the typed factory. '
    + 'IntelliSense shows every property for that specific widget type. Mix freely with batch shorthands.',
  formDef: () => [
    _guiInputs({ firstName: 'string', lastName: 'string' }),
    _guiTextInput('email', { placeholder: 'you@example.com', validator: { pattern: '^[^@]+@[^@]+$' } }),
    _guiNumberInput('age', { minimum: 0, maximum: 150, step: 1 }),
    _guiBooleanInput('newsletter', { togglePosition: 'right' }),
  ],
};
