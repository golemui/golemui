import { FormDemoDefinition } from '../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

export const layoutsDemo: FormDemoDefinition = {
  title: '4. Layout Composition',
  category: 'Ch1: Getting Started',
  description:
    'Wrap any group of fields in a layout. Layouts nest freely. ' +
    'The auto-generated root layout is a vertical stack — override it or nest within it.',
  formDef: () => [
    gui.layouts.horizontalFlex([
      gui.inputs.textInput('firstName'),
      gui.inputs.textInput('lastName'),
    ]),
    gui.inputs.textInput('email'),
    gui.layouts.horizontalFlex([
      gui.inputs.numberInput('age', { minimum: 0 }),
      gui.inputs.booleanInput('newsletter'),
    ]),
  ],
};
