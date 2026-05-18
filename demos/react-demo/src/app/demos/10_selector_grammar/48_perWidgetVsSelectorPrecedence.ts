import { type FormDemoDefinition } from '../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

export const perWidgetVsSelectorPrecedenceDemo: FormDemoDefinition = {
  title: '48. Per-Widget vs Selector-Level Precedence',
  category: 'Ch10: Selector Grammar',
  description:
    'When per-widget states blocks and selector-level state(...) target the same widget ' +
    '+ state + property, the per-widget block wins regardless of selector array position. ' +
    'The model mirrors CSS — inline beats stylesheet. Use per-widget as a carve-out from a ' +
    'broad selector-level rule. Toggle "Lock" to see: email becomes disabled (selector-level ' +
    'wins for plain inputs), adminNote stays editable (per-widget carve-out wins).',
  formDef: () => [
    gui.inputs.checkbox('isLocked', { label: 'Lock' }),
    gui.inputs.textInput('email', { label: 'Email' }),
    gui.inputs.textInput('adminNote', {
      label: 'Admin note',
      states: { locked: { disabled: false } },
    }),
  ],
  formSelectors: () => [gui.selectors.state('locked').inputs({ override: { disabled: true } })],
  formConfig: () => ({
    states: { locked: '!!$form.isLocked' },
  }),
};
