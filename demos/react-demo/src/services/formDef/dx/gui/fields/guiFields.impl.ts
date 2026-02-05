import {
  ActionDef,
  ControllerDefCallback,
  DynamicDefParams,
  InputTags,
  OneOfDataInputDefs,
  ValidShortcutType,
} from '../../../formDef.domain';
import { GuiFieldsShortcut, GuiShortcutType } from '../gui.domain';
import inputDefsByKeyService from '../../config/helpers/inputDefsByKey.service';

export type DxField = ProcessedDxField | ValidShortcutType | InputTags;
export type OneOfDataInputDefsCallback = (params: DynamicDefParams) => OneOfDataInputDefs;
export type ProcessedDxField = OneOfDataInputDefs | OneOfDataInputDefsCallback;
export type ProcessedValidControllerDef = ActionDef | ControllerDefCallback;

export type FacadeFieldByKey<T extends Record<string, any>> = Partial<Record<keyof T, DxField>>;

export type ProcessedDxFieldsByKey<T extends Record<string, any>> = Partial<
  Record<keyof T, ProcessedDxField>
>;

export interface ReadyToMapField {
  key: string;
  processedField: ProcessedDxField;
}

export const _guiFields = <T extends Record<string, any>>(
  defs: FacadeFieldByKey<T>,
  tags?: string[],
): GuiFieldsShortcut => {
  const fields = inputDefsByKeyService.expandFields(defs);
  const asReadyToMap = Object.entries(fields).map<ReadyToMapField>(([key, value]) => {
    return {
      key,
      processedField: value as ProcessedDxField,
    }
  })
  return {
    fields: asReadyToMap,
    type: GuiShortcutType.FIELDS,
    tags: tags ?? [],
  };
};
