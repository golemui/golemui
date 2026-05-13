import { FormDemoDefinition } from '../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

export const reusableScopeVariablesDemo: FormDemoDefinition = {
  title: '45. Reusable Scope Variables',
  category: 'Ch10: Selector Grammar',
  description:
    'Hold a partially-built chain in a const, then branch from it into multiple type selectors. ' +
    'Each scope-method call returns a new ScopeChain (immutable) — the original variable can be ' +
    'reused without contamination. Toggle "Lock" to see lockable-tagged widgets respond ' +
    'together: inputs disable, the action label changes.',
  formDef: () => [
    gui.inputs.checkbox('isLocked', { label: 'Lock section' }),
    gui.inputs.textInput('firstName', { label: 'First name' }, ['lockable']),
    gui.inputs.textInput('lastName', { label: 'Last name' }, ['lockable']),
    gui.inputs.textInput('publicNote', { label: 'Public note (always editable)' }),
    gui.actions.button({ label: 'Continue' }, ['lockable']),
  ],
  formSelectors: () => {
    const lockedSection = gui.selectors.tag('lockable').state('locked');
    return [
      lockedSection.inputs({ override: { disabled: true } }),
      lockedSection.actions({ override: { label: 'Locked' } }),
    ];
  },
  formConfig: () => ({
    states: { locked: '!!$form.isLocked' },
  }),
};
