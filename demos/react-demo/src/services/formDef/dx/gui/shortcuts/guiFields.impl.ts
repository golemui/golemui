import {
  ActionDefCallback,
  ActionDef,
  DynamicInputDefParams,
  InputDef,
  InputTags,
  ValidShortcutType,
} from '../../../formDef.domain';
import {
  GuiFieldsShortcut,
  GuiItemsShortcutType,
  GuiShortcutType,
  ReadyToMapInputDef,
} from '../gui.domain';
import inputDefsByKeyService from '../../config/helpers/inputDefsByKey.service';

export type DxField = InputDefOrCallback | ValidShortcutType | InputTags;
export type InputDefCallback = (params: DynamicInputDefParams) => InputDef;
export type InputDefOrCallback = InputDef | InputDefCallback;
export type ProcessedValidControllerDef = ActionDef | ActionDefCallback;

export type FacadeFieldByKey<T extends Record<string, any>> = Partial<Record<keyof T, DxField>>;

export type ProcessedDxFieldsByKey<T extends Record<string, any>> = Partial<
  Record<keyof T, InputDefOrCallback>
>;

export const _guiFields = <T extends Record<string, any>>(
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
