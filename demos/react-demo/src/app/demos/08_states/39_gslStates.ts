import { FormDemoDefinition } from '../../../formRegistry.domain';
import {
  _guiInputs,
  _guiCheckbox,
  _guiButton,
  _gslRoot,
  _gslStates,
  _gslInputs,
  _gslLayouts,
} from '@golemui/gui-shared';

export const gslStatesDemo: FormDemoDefinition = {
  title: '39. GSL State Overrides with _gslStates',
  category: 'Ch8: States',
  description:
    'When the "locked" state is active (via checkbox), _gslStates disables all '
    + 'inputs and switches all layouts to column direction. This is a broad override '
    + 'that applies across all widget kinds — contrast with per-widget overrides '
    + 'which target individual widgets.',
  formDef: () => [
    _guiCheckbox('isLocked', { label: 'Lock form' }),
    _guiInputs({ firstName: 'string', lastName: 'string', email: 'string' }),
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
