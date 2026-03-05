import { GuiItemTypes } from '../../core/dx.domain';
import {
  GuiInputsShortcut,
  InputEntry,
  InputDefOrCallback,
  SimpleFieldDef,
} from './inputs.domain';
import inputDefsByKeyService from './inputDefsByKey.service';

export function _guiInputs(
  defs: Record<string, SimpleFieldDef>,
  tags?: string[],
): GuiInputsShortcut {
  const fields = inputDefsByKeyService.expandFields(defs);
  const items = Object.entries(fields).map<InputEntry>(([key, value]) => {
    return {
      key,
      def: value as InputDefOrCallback,
    };
  });
  return {
    items,
    type: 'ITEMS',
    itemType: GuiItemTypes.INPUTS,
    tags: tags ?? [],
  };
}
