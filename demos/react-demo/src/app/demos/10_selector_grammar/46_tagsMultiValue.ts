import { type FormDemoDefinition } from '../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

export const tagsMultiValueDemo: FormDemoDefinition = {
  title: '46. tagsAnd / tagsOr',
  category: 'Ch10: Selector Grammar',
  description:
    'Multi-value tag operators. tagsAnd matches widgets carrying ALL listed tags — the ' +
    'apiKey field has both [admin, sensitive] and becomes readonly. tagsOr matches widgets ' +
    'carrying ANY listed tag — both required and mandatory inputs get the asterisk treatment. ' +
    'Single-value tag(x) is shorthand for tagsAnd([x]).',
  formDef: () => [
    gui.inputs.textInput('publicNote', { label: 'Public note' }),
    gui.inputs.textInput('legalName', { label: 'Legal name' }, ['required']),
    gui.inputs.textInput('taxId', { label: 'Tax ID' }, ['mandatory']),
    gui.inputs.textInput('adminNote', { label: 'Admin note' }, ['admin']),
    gui.inputs.textInput('apiKey', { label: 'API key' }, ['admin', 'sensitive']),
  ],
  formSelectors: () => [
    gui.selectors.tagsOr(['required', 'mandatory']).inputs({
      override: (cur) => ({
        placeholder: `${('placeholder' in cur ? cur.placeholder : undefined) ?? cur.path} *`,
      }),
    }),
    gui.selectors.tagsAnd(['admin', 'sensitive']).inputs({
      override: { readonly: true },
    }),
  ],
};
