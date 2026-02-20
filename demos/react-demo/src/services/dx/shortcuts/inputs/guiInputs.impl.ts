import { GuiItemTypes } from '../../core/dx.domain';
import {
  GuiInputsShortcut,
  InputEntry,
  InputDefOrCallback,
} from './inputs.domain';
import inputDefsByKeyService from './inputDefsByKey.service';
import { FacadeFieldByKey } from './inputDefsByKey.service';
export const _guiInputs = <T extends Record<string, any>>(
  defs: FacadeFieldByKey<T>,
  tags?: string[],
): GuiInputsShortcut => {
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
};
