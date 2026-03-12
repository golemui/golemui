import { FormDemoDefinition } from '../../formRegistry.domain';
import {
  _guiInputs,
  _guiTextInput,
  _gslTextInputs,
  _gslNumberInputs,
  _gslInputById,
  _gslLayoutById,
  _gslActionById,
} from '@golemui/gui-shared';

export const byIdAndByTypeDemo: FormDemoDefinition = {
  title: '13. By-ID & By-Type',
  category: 'Ch3: Selectors',
  description:
    'Target a specific widget by its uid, or narrow to a subtype. Every registered type gets a by-ID selector out of the box. '
    + 'Input subtypes get their own type selectors — override all number inputs without touching text inputs.',
  formDef: () => [
    _guiInputs({ name: 'string', age: 'number', score: 'number' }),
    _guiTextInput('email', { uid: '#email', placeholder: 'you@example.com' }),
  ],
  formSelectors: () => [
    _gslTextInputs({ decorator: { placeholder: 'Text fields only' } }),
    _gslNumberInputs({ decorator: { placeholder: 'Numbers only' } }),
    _gslInputById('#email', { decorator: { readonly: true } }),
    _gslLayoutById('#root', { decorator: { direction: 'row' } }),
    _gslActionById('#submit', { decorator: { label: 'Go!' } }),
  ],
};
