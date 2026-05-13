import { gui } from '@golemui/gui-shared';
import { FormDemoDefinition } from '../../formRegistry.domain';

export const gslStatesDemo: FormDemoDefinition = {
  title: '39. GSL State Overrides',
  category: 'Ch8: States',
  description:
    'When the "locked" state is active (via checkbox), state-scoped selectors disable all ' +
    'inputs and reflow the layout from row to column. The inputs start in a ' +
    'horizontal row — locking the form visibly stacks them vertically. This is a ' +
    'broad override that applies across all widget kinds — contrast with per-widget ' +
    'overrides which target individual widgets.',
  formDef: () => [
    gui.inputs.checkbox('isLocked', { label: 'Lock form' }),
    gui.layouts.horizontalFlex([
      gui.inputs.textInput('firstName'),
      gui.inputs.textInput('lastName'),
      gui.inputs.textInput('email'),
    ]),
    gui.actions.button({ label: 'Submit' }),
  ],
  formSelectors: () => {
    const locked = gui.selectors.state('locked');
    return [
      locked.inputs({ override: { disabled: true } }),
      locked.layouts({ override: { direction: 'column' } }),
    ];
  },
  formConfig: () => ({
    states: {
      locked: '!!$form.isLocked',
    },
  }),
};
