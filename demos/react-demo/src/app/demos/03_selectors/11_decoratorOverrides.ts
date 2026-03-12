import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs, _guiCalendar, _gslInputs, _gslCalendar } from '@golemui/gui-shared';

export const decoratorOverridesDemo: FormDemoDefinition = {
  title: '11. Decorator Overrides',
  category: 'Ch3: Selectors',
  description:
    'A decorator overrides properties on every matched widget. Pass a static object to set the same value everywhere, '
    + 'or a callback that receives the current widget state and computes the override. '
    + 'The callback gets the widget\'s path, label, and all other properties.',
  formDef: () => [
    _guiInputs({ firstName: 'string', lastName: 'string', email: 'string' }),
    _guiCalendar('birthDate'),
  ],
  formSelectors: () => [
    _gslInputs({ decorator: (cur) => ({ placeholder: `Enter ${cur.path}` }) }),
    _gslCalendar({ decorator: { readonly: true } }),
  ],
};
