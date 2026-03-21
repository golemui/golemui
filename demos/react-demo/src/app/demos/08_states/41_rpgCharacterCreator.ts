import { FormDemoDefinition } from '../../../formRegistry.domain';
import {
  _guiTextInput,
  _guiSelect,
  _guiCheckbox,
  _guiButton,
  _guiVerticalStack,
  _guiHorizontalStack,
  _guiInputs,
  _gslRoot,
  _gslStates,
  _gslInputs,
} from '@golemui/gui-shared';

const classes = [
  { label: 'Warrior', value: 'warrior' },
  { label: 'Mage', value: 'mage' },
  { label: 'Rogue', value: 'rogue' },
];

const shieldTypes = [
  { label: 'Tower Shield', value: 'tower' },
  { label: 'Buckler', value: 'buckler' },
  { label: 'Kite Shield', value: 'kite' },
];

const spellSchools = [
  { label: 'Evocation', value: 'evocation' },
  { label: 'Necromancy', value: 'necromancy' },
  { label: 'Illusion', value: 'illusion' },
];

const stealthStyles = [
  { label: 'Shadow', value: 'shadow' },
  { label: 'Disguise', value: 'disguise' },
  { label: 'Acrobatics', value: 'acrobatics' },
];

export const rpgCharacterCreatorDemo: FormDemoDefinition = {
  title: '41. RPG Character Creator',
  category: 'Ch8: States',
  description:
    'Build an adventurer using hierarchical states, per-widget overrides, '
    + 'and _gslStates for a "finalize" lock.\n\n'
    + 'Features used:\n'
    + '• Hierarchical states with $ — create$warrior, create$mage, create$rogue\n'
    + '• State visibility — class-specific gear appears only for the matching class\n'
    + '• Per-widget state overrides — button label changes per class '
    + '("Forge Warrior" / "Summon Mage" / "Deploy Rogue")\n'
    + '• _gslStates — "finalized" locks all inputs so the character sheet is read-only\n'
    + '• Per-widget override beats _gslStates — class select stays enabled when finalized',
  formDef: () => [
    _guiTextInput('heroName', { label: 'Hero name' }),
    _guiSelect('charClass', {
      options: classes,
      label: 'Class',
      states: { finalized: { disabled: false } },
    }),
    _guiVerticalStack({
      children: [
        _guiSelect('shield', { options: shieldTypes, label: 'Shield type' }),
        _guiInputs({ battleCry: 'string' }),
      ],
      states: { create$warrior: { visible: true } },
    }),
    _guiVerticalStack({
      children: [
        _guiSelect('spellSchool', { options: spellSchools, label: 'Spell school' }),
        _guiInputs({ familiar: 'string' }),
      ],
      states: { create$mage: { visible: true } },
    }),
    _guiVerticalStack({
      children: [
        _guiSelect('stealth', { options: stealthStyles, label: 'Stealth style' }),
        _guiInputs({ alias: 'string' }),
      ],
      states: { create$rogue: { visible: true } },
    }),
    _guiHorizontalStack([
      _guiCheckbox('isFinalized', { label: 'Finalize character' }),
      _guiButton({
        label: 'Create',
        states: {
          create$warrior: { label: 'Forge Warrior' },
          create$mage: { label: 'Summon Mage' },
          create$rogue: { label: 'Deploy Rogue' },
          finalized: { label: 'Character Locked', disabled: true },
        },
      }),
    ]),
  ],
  formSelectors: () =>
    _gslRoot(
      _gslStates('finalized', _gslInputs({ decorator: { disabled: true } })),
    ),
  formConfig: () => ({
    states: {
      create: '!!$form.charClass',
      create$warrior: '$form.charClass === "warrior"',
      create$mage: '$form.charClass === "mage"',
      create$rogue: '$form.charClass === "rogue"',
      finalized: '!!$form.isFinalized',
    },
  }),
};
