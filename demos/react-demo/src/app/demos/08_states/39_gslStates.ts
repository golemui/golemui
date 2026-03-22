import {
  _gslInputs,
  _gslLayouts,
  _gslRoot,
  _gslStates,
  _guiButton,
  _guiCheckbox,
  _guiHorizontalStack,
  _guiInputs,
} from '@golemui/gui-shared';
import { FormDemoDefinition } from '../../formRegistry.domain';

export const gslStatesDemo: FormDemoDefinition = {
  title: '39. GSL State Overrides with _gslStates',
  category: 'Ch8: States',
  description:
    'When the "locked" state is active (via checkbox), _gslStates disables all ' +
    'inputs and reflows the layout from row to column. The inputs start in a ' +
    'horizontal row — locking the form visibly stacks them vertically. This is a ' +
    'broad override that applies across all widget kinds — contrast with per-widget ' +
    'overrides which target individual widgets.',
  warnings: [
    'Known issue: the _gslLayouts direction override (row → column) does not take ' +
      'effect at runtime. The DX pipeline correctly produces the state-suffixed ' +
      'props (direction.locked), but the core rendering layer does not resolve ' +
      'state-suffixed layout props during recalculation. The disabled override works ' +
      'because disabled is a core-suffixable property; direction lives in props and ' +
      'is not picked up by the state engine for layout widgets.',
  ],
  formDef: () => [
    _guiCheckbox('isLocked', { label: 'Lock form' }),
    _guiHorizontalStack([_guiInputs({ firstName: 'string', lastName: 'string', email: 'string' })]),
    _guiButton({ label: 'Submit' }),
  ],
  formSelectors: () =>
    _gslRoot(
      _gslStates('locked', _gslInputs({ decorator: { disabled: true } })),
      _gslStates('locked', _gslLayouts({ decorator: { direction: 'column' } })),
    ),
  formConfig: () => ({
    states: {
      locked: '!!$form.isLocked',
    },
  }),
};
