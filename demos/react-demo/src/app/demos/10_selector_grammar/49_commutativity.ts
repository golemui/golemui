import { FormDemoDefinition } from '../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

export const commutativityDemo: FormDemoDefinition = {
  title: '49. Chain Commutativity',
  category: 'Ch10: Selector Grammar',
  description:
    'The chain is a set of conditions, not a sequence — order does not affect semantics. '
    + 'tag(\'foo\').state(\'locked\') matches the same widgets as state(\'locked\').tag(\'foo\'). '
    + 'Both selectors below target the foo-tagged inputs in the locked state, written in opposite '
    + 'orderings; one disables them, the other relabels them. Toggle "Lock" — foo inputs get BOTH '
    + 'overrides (proving both chains matched the same widget set). Plain input is untouched.',
  formDef: () => [
    gui.inputs.checkbox('isLocked', { label: 'Lock' }),
    gui.inputs.textInput('plain', { label: 'Plain input' }),
    gui.inputs.textInput('fooFirst', { label: 'Foo input A' }, ['foo']),
    gui.inputs.textInput('fooSecond', { label: 'Foo input B' }, ['foo']),
  ],
  formSelectors: () => [
    gui.selectors.tag('foo').state('locked').inputs({ override: { disabled: true } }),
    gui.selectors.state('locked').tag('foo').inputs({ override: { label: 'Locked (foo)' } }),
  ],
  formConfig: () => ({
    states: { locked: '!!$form.isLocked' },
  }),
};
