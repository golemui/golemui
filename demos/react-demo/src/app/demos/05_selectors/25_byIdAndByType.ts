import { type FormDemoDefinition } from '../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

export const byIdAndByTypeDemo: FormDemoDefinition = {
  title: '25. By-ID & By-Type',
  category: 'Ch5: Selectors',
  description:
    'Target a specific widget by its uid, or narrow to a subtype. Every registered type gets a by-ID selector out of the box. ' +
    'Input subtypes get their own type selectors — override all number inputs without touching text inputs.',
  formDef: () => [
    gui.inputs.textInput('name'),
    gui.inputs.numberInput('age'),
    gui.inputs.numberInput('score'),
    gui.inputs.textInput('email', { uid: 'email', placeholder: 'you@example.com' }),
  ],
  formSelectors: () => [
    gui.selectors.textInputs({ override: { placeholder: 'Text fields only' } }),
    gui.selectors.numberInputs({ override: { placeholder: 'Numbers only' } }),
    gui.selectors.inputByUid('email', { override: { readonly: true } }),
    gui.selectors.layoutByUid('#root', { override: { direction: 'row' } }),
    gui.selectors.actionByUid('#submit', { override: { label: 'Go!' } }),
  ],
};
