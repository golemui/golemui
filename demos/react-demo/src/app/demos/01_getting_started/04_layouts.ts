import { FormDemoDefinition } from '../../formRegistry.domain';
import {
  _guiInputs,
  _guiNumberInput,
  _guiBooleanInput,
  _guiHorizontalStack,
} from '@golemui/gui-shared';

export const layoutsDemo: FormDemoDefinition = {
  title: '4. Layout Composition',
  category: 'Ch1: Getting Started',
  description:
    'Wrap any group of fields in a layout. Layouts nest freely. '
    + 'The auto-generated root layout is a vertical stack — override it or nest within it.',
  formDef: () => [
    _guiHorizontalStack([
      _guiInputs({ firstName: 'string', lastName: 'string' }),
    ]),
    _guiInputs({ email: 'string' }),
    _guiHorizontalStack([
      _guiNumberInput('age', { minimum: 0 }),
      _guiBooleanInput('newsletter'),
    ]),
  ],
};
