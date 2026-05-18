import { type FormDemoDefinition } from '../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

export const moreWidgetsDemo: FormDemoDefinition = {
  title: '2. More Widget Types',
  category: 'Ch1: Getting Started',
  description:
    'Same pattern, different widgets. Each widget type has its own factory with the same (path, props?, tags?) signature. ' +
    'Calendar adds a date picker. Textarea adds a multi-line input.',
  formDef: () => [
    gui.inputs.textInput('firstName'),
    gui.inputs.textInput('lastName'),
    gui.inputs.calendar('birthDate', { minDate: '2000-01-01' }),
    gui.inputs.textarea('notes', { placeholder: 'Anything else we should know?' }),
  ],
};
