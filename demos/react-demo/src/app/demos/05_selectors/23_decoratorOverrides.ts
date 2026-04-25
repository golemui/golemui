import { FormDemoDefinition } from '../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

export const decoratorOverridesDemo: FormDemoDefinition = {
  title: '23. Decorator Overrides',
  category: 'Ch5: Selectors',
  description:
    'A decorator overrides properties on every matched widget. Pass a static object to set the same value everywhere, '
    + 'or a callback that receives the current widget state and computes the override. '
    + 'The callback gets the widget\'s path, label, and all other properties.',
  formDef: () => [
    gui.inputs.textInput('firstName'),
    gui.inputs.textInput('lastName'),
    gui.inputs.textInput('email'),
    gui.inputs.calendar('birthDate'),
  ],
  formSelectors: () => [
    gui.selectors.inputs({ override: (cur) => ({ placeholder: `Enter ${cur.path}` }) }),
    gui.selectors.calendars({ override: { readonly: true } }),
  ],
};
