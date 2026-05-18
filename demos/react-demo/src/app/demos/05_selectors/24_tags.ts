import { type FormDemoDefinition } from '../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

export const tagsDemo: FormDemoDefinition = {
  title: '24. Tags',
  category: 'Ch5: Selectors',
  description:
    'Tag fields in the structure, then target them with scoped selectors. ' +
    'Tags are declared inline — either as tuple suffixes or as the third parameter on any factory. ' +
    'gui.selectors.tag(name) narrows a selector to widgets carrying that tag.',
  formDef: () => [
    gui.inputs.textInput('firstName', {}, ['required']),
    gui.inputs.textInput('lastName', {}, ['required']),
    gui.inputs.textInput('nickname'),
    gui.inputs.textInput('email', { placeholder: 'you@example.com' }, ['required', 'highlight']),
  ],
  formSelectors: () => [
    gui.selectors.tag('required').inputs({
      override: (cur) => ({
        placeholder: `${('placeholder' in cur ? cur.placeholder : undefined) ?? cur.path} *`,
      }),
    }),
    gui.selectors.tag('highlight').inputs({
      override: { label: '⚠ Required field' },
    }),
  ],
};
