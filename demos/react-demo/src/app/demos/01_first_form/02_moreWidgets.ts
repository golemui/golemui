import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs, _guiCalendar, _guiTextarea } from '../../../services/dx';

export const moreWidgetsDemo: FormDemoDefinition = {
  title: '2. More Widget Types',
  category: 'Ch1: First Form',
  description:
    'Same pattern, different widgets. Each widget type has its own factory with the same (path, props?, tags?) signature. '
    + 'Calendar adds a date picker. Textarea adds a multi-line input.',
  formDef: () => [
    _guiInputs({ firstName: 'string', lastName: 'string' }),
    _guiCalendar('birthDate', { minDate: '2000-01-01' }),
    _guiTextarea('notes', { placeholder: 'Anything else we should know?' }),
  ],
};
