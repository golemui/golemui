import { GuiShortcutType, GuiItemsShortcutType } from '../../core/dx.domain';
import {
  GuiFieldsShortcut,
  ReadyToMapInputDef,
  InputDefOrCallback,
} from './inputs.domain';
import inputDefsByKeyService from './inputDefsByKey.service';
import { FacadeFieldByKey } from './inputDefsByKey.service';

export type PartialInputDecoratorOrCallback = Partial<import('./inputs.domain').InputDecorator> | import('./inputs.domain').PartialInputDefCallback;

export const _guiInputs = <T extends Record<string, any>>(
  defs: FacadeFieldByKey<T>,
  tags?: string[],
): GuiFieldsShortcut => {
  const fields = inputDefsByKeyService.expandFields(defs);
  const asReadyToMap = Object.entries(fields).map<ReadyToMapInputDef>(([key, value]) => {
    return {
      key,
      inputDefOrCallback: value as InputDefOrCallback,
    };
  });
  return {
    items: asReadyToMap,
    type: GuiShortcutType.ITEMS,
    itemsType: GuiItemsShortcutType.INPUTS,
    tags: tags ?? [],
  };
};
