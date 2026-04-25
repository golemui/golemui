import { FormDemoDefinition } from '../../formRegistry.domain';
import { gui, _gslTag } from '@golemui/gui-shared';

export const tagsDemo: FormDemoDefinition = {
  title: '24. Tags',
  category: 'Ch5: Selectors',
  description:
    'Tag fields in the structure, then target them with scoped selectors. '
    + 'Tags are declared inline — either as tuple suffixes in gui.fields or as the third parameter on any factory. '
    + '_gslTag wraps any selector and only applies it to widgets with that tag.',
  formDef: () => [
    gui.inputs.textInput('firstName', {}, ['required']),
    gui.inputs.textInput('lastName', {}, ['required']),
    gui.inputs.textInput('nickname'),
    gui.inputs.textInput('email', { placeholder: 'you@example.com' }, ['required', 'highlight']),
  ],
  formSelectors: () => [
    _gslTag('required', gui.selectors.inputs({
      override: (cur) => ({
        placeholder: `${('placeholder' in cur ? cur.placeholder : undefined) ?? cur.path} *`,
      }),
    })),
    _gslTag('highlight', gui.selectors.inputs({
      override: { label: '⚠ Required field' },
    })),
  ],
};
