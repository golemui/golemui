import { gui, _gslRoot, _gslStates } from '@golemui/gui-shared';
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
  warnings: [
    'Known issue: the layouts direction override (row → column) does not take ' +
      'effect at runtime. The DX pipeline correctly produces the state-suffixed ' +
      'props (direction.locked), but the core rendering layer does not resolve ' +
      'state-suffixed layout props during recalculation. The disabled override works ' +
      'because disabled is a core-suffixable property; direction lives in props and ' +
      'is not picked up by the state engine for layout widgets.',
  ],
  formDef: () => [
    gui.inputs.checkbox('isLocked', { label: 'Lock form' }),
    gui.layouts.horizontalFlex([gui.inputs.textInput('firstName'), gui.inputs.textInput('lastName'), gui.inputs.textInput('email')]),
    gui.actions.button({ label: 'Submit' }),
  ],
  formSelectors: () =>
    _gslRoot(
      _gslStates('locked', gui.selectors.inputs({ override: { disabled: true } })),
      _gslStates('locked', gui.selectors.layouts({ override: { direction: 'column' } })),
    ),
  formConfig: () => ({
    states: {
      locked: '!!$form.isLocked',
    },
  }),
};
