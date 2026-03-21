import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs, _guiTextInput, _gslTag, _gslInputs } from '@golemui/gui-shared';

export const tagsDemo: FormDemoDefinition = {
  title: '24. Tags',
  category: 'Ch5: Selectors',
  description:
    'Tag fields in the structure, then target them with scoped selectors. '
    + 'Tags are declared inline — either as tuple suffixes in _guiInputs or as the third parameter on any factory. '
    + '_gslTag wraps any selector and only applies it to widgets with that tag.',
  formDef: () => [
    _guiInputs({
      firstName: ['string', 'required'],
      lastName: ['string', 'required'],
      nickname: 'string',
    }),
    _guiTextInput('email', { placeholder: 'you@example.com' }, ['required', 'highlight']),
  ],
  formSelectors: () => [
    _gslTag('required', _gslInputs({
      decorator: (cur) => ({
        placeholder: `${('placeholder' in cur ? cur.placeholder : undefined) ?? cur.path} *`,
      }),
    })),
    _gslTag('highlight', _gslInputs({
      decorator: { label: '⚠ Required field' },
    })),
  ],
};
